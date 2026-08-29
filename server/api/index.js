const app = require('../src/app');
const { connectDB } = require('../src/config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error('Vercel Function Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FUNCTION_ERROR',
        message: error.message,
      },
    });
  }
};
