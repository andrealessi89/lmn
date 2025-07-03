import prisma from '../config/database.js';

export const getConfigs = async (req, res, next) => {
  try {
    const configs = await prisma.config.findMany();
    
    const configObject = configs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {});

    res.json(configObject);
  } catch (error) {
    next(error);
  }
};

export const saveConfig = async (req, res, next) => {
  try {
    const { key, value, description } = req.body;

    if (!key || !value) {
      return res.status(400).json({ 
        error: 'Key and value are required' 
      });
    }

    const config = await prisma.config.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description }
    });

    res.json({ 
      message: 'Config saved successfully', 
      config 
    });
  } catch (error) {
    next(error);
  }
};