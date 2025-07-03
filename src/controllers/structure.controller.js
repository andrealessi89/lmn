import prisma from '../config/database.js';
import redtrackService from '../services/redtrack.service.js';
import { cloackmeService } from '../services/cloackme.service.js';

export const createGoogleStructure = async (req, res, next) => {
  try {
    const { domain, product, cloaker } = req.body;

    if (!domain || !product) {
      return res.status(400).json({ 
        error: 'Domain and product are required' 
      });
    }

    let domainRecord = await prisma.domain.findUnique({
      where: { domain }
    });

    if (!domainRecord) {
      const redtrackDomain = await redtrackService.createDomain(domain);
      domainRecord = await prisma.domain.create({
        data: {
          domain,
          product,
          cloakerEnabled: cloaker || false,
          redtrackId: redtrackDomain?.id
        }
      });
    }

    let cloackmeId = null;
    if (cloaker) {
      const cloackmeResponse = await cloackmeService.createCampaign({
        domain,
        product
      });
      cloackmeId = cloackmeResponse?.id;
    }

    const fourLetters = generateFourLetters();
    
    const landerUrl = cloaker 
      ? `https://${domain}/ck?` 
      : `https://${domain}/${fourLetters}lander?`;
    
    const prelanderUrl = `https://${domain}/${fourLetters}pre?`;

    const lander = await redtrackService.createLander({
      name: `${domain} | ${product} | Lander`,
      url: landerUrl
    });

    const prelander = await redtrackService.createLander({
      name: `${domain} | ${product} | Prelander`,
      url: prelanderUrl
    });

    await prisma.domain.update({
      where: { id: domainRecord.id },
      data: {
        cloackmeId,
        landerId: lander?.id,
        prelanderId: prelander?.id
      }
    });

    res.json({
      message: 'Google structure created successfully',
      data: {
        domain: domainRecord,
        cloacker: cloaker ? { id: cloackmeId } : null,
        lander: { id: lander?.id, url: landerUrl },
        prelander: { id: prelander?.id, url: prelanderUrl }
      }
    });
  } catch (error) {
    next(error);
  }
};

function generateFourLetters() {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return result;
}