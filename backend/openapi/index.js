import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Swagger config
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Blood Bank Management System (BBMS) API',
      version: '1.0.0',
      description: 'RESTful API documentation for the Blood Bank Management System',
    },
    servers: [
      {
        url: process.env.BASE_URL || 'http://localhost:5000',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  // ✅ CRITICAL FIX: Tell Swagger to look in routes and controllers for @swagger comments
  apis: [
    './routes/*.js', 
    './controllers/*.js'
  ],
};

// Setup
const swaggerDocs = swaggerJsDoc(swaggerOptions);

export {
  swaggerDocs,
  swaggerUi
};