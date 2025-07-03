import prisma from '../config/database.js';
import redtrackService from '../services/redtrack.service.js';

export const getDomains = async (req, res, next) => {
  try {
    const domains = await prisma.domain.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json(domains);
  } catch (error) {
    next(error);
  }
};

export const createDomain = async (req, res, next) => {
  try {
    const { domain, product, cloakerEnabled } = req.body;

    if (!domain || !product) {
      return res.status(400).json({ 
        error: 'Domain and product are required' 
      });
    }

    const existingDomain = await prisma.domain.findUnique({
      where: { domain }
    });

    if (existingDomain) {
      return res.status(409).json({ 
        error: 'Domain already exists' 
      });
    }

    const redtrackDomain = await redtrackService.createDomain(domain);

    const newDomain = await prisma.domain.create({
      data: {
        domain,
        product,
        cloakerEnabled: cloakerEnabled || false,
        redtrackId: redtrackDomain?.id
      }
    });

    res.status(201).json({
      message: 'Domain created successfully',
      domain: newDomain
    });
  } catch (error) {
    next(error);
  }
};