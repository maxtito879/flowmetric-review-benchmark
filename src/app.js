'use strict';

const seed = require('./config/seed');
const { FakePaymentGateway } = require('./gateways/FakePaymentGateway');
const { authenticate, requireRole } = require('./middleware/authMiddleware');
const { createErrorHandler } = require('./middleware/errorHandler');
const { createRequestLogger } = require('./middleware/requestLogger');
const { CouponRepository } = require('./repositories/CouponRepository');
const { InventoryRepository } = require('./repositories/InventoryRepository');
const { OrderRepository } = require('./repositories/OrderRepository');
const { PaymentRepository } = require('./repositories/PaymentRepository');
const { ProductRepository } = require('./repositories/ProductRepository');
const { UserRepository } = require('./repositories/UserRepository');
const { Router } = require('./router');
const { registerRoutes } = require('./routes');
const { AuthService } = require('./services/AuthService');
const { InventoryService } = require('./services/InventoryService');
const { NotificationService } = require('./services/NotificationService');
const { OrderService } = require('./services/OrderService');
const { PaymentService } = require('./services/PaymentService');
const { PricingService } = require('./services/PricingService');
const { ProductService } = require('./services/ProductService');
const { ShippingService } = require('./services/ShippingService');
const { TaxService } = require('./services/TaxService');
const { AuthController } = require('./controllers/AuthController');
const { OrderController } = require('./controllers/OrderController');
const { PaymentController } = require('./controllers/PaymentController');
const { ProductController } = require('./controllers/ProductController');
const { CategoryController } = require('./controllers/CategoryController');
const { ReportController } = require('./controllers/ReportController');
const { createRateLimiter } = require('./middleware/rateLimiter');
const { CategoryRepository } = require('./repositories/CategoryRepository');
const { CategoryService } = require('./services/CategoryService');
const { ReportService } = require('./services/ReportService');
const { newId } = require('./utils/ids');
const { NotFoundError } = require('./utils/errors');
const { systemClock } = require('./utils/clock');
const { createLogger } = require('./utils/logger');

function createApp(options = {}) {
  const logger = options.logger || createLogger({ level: options.logLevel || 'info' });
  const clock = options.clock || systemClock;
  const tokenSecret = options.tokenSecret || process.env.TOKEN_SECRET;

  const productRepository = new ProductRepository(options.products || seed.products);
  const inventoryRepository = new InventoryRepository(options.stock || seed.stock);
  const couponRepository = new CouponRepository(options.coupons || seed.coupons);
  const categoryRepository = new CategoryRepository(options.categories || seed.categories);
  const orderRepository = new OrderRepository();
  const paymentRepository = new PaymentRepository();
  const userRepository = new UserRepository();
  const paymentGateway = options.paymentGateway || new FakePaymentGateway();

  const notificationService = new NotificationService({ logger });
  const authService = new AuthService({ userRepository, tokenSecret, clock });
  const inventoryService = new InventoryService({ inventoryRepository, logger });
  const pricingService = new PricingService({
    couponRepository,
    taxService: new TaxService(),
    shippingService: new ShippingService(),
  });
  const productService = new ProductService({ productRepository, inventoryRepository });
  const orderService = new OrderService({
    orderRepository,
    productRepository,
    inventoryService,
    pricingService,
    notificationService,
    clock,
  });
  const paymentService = new PaymentService({
    paymentRepository,
    orderService,
    paymentGateway,
    notificationService,
    clock,
  });

  const categoryService = new CategoryService({ categoryRepository });
  const reportService = new ReportService({ orderRepository, paymentRepository, userRepository });

  const controllers = {
    auth: new AuthController({ authService }),
    product: new ProductController({ productService }),
    order: new OrderController({ orderService }),
    payment: new PaymentController({ paymentService }),
    category: new CategoryController({ categoryService }),
    report: new ReportController({ reportService }),
  };

  const router = new Router();
  registerRoutes(router, {
    controllers,
    middleware: {
      authenticate: authenticate(authService),
      loginLimiter: createRateLimiter({ max: 10, clock }),
      requireRole,
    },
  });

  const logRequest = createRequestLogger(logger);
  const handleError = createErrorHandler(logger);

  async function handle(method, path, request = {}) {
    const headers = Object.fromEntries(
      Object.entries(request.headers || {}).map(([key, value]) => [key.toLowerCase(), value]),
    );
    const req = {
      id: newId('req'),
      method,
      path,
      params: {},
      query: request.query || {},
      body: request.body,
      headers,
      user: null,
    };

    try {
      const route = router.match(method, path);
      if (!route) {
        throw new NotFoundError('Ruta no encontrada');
      }
      req.params = route.params;
      logRequest(req);

      const handlers = [...route.handlers];
      const controller = handlers.pop();
      for (const middleware of handlers) {
        await middleware(req);
      }
      return await controller(req);
    } catch (error) {
      return handleError(error, req);
    }
  }

  return {
    handle,
    deps: {
      authService,
      orderService,
      paymentService,
      pricingService,
      inventoryService,
      inventoryRepository,
      orderRepository,
      paymentRepository,
      notificationService,
      paymentGateway,
      productService,
      reportService,
    },
  };
}

module.exports = { createApp };
