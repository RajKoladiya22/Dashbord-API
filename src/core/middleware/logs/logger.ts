import fs from 'fs';
import path from 'path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { envConfiguration } from '../../../config/env.config';
// import { validatedEnv } from '@config/validate-env';
import { validatedEnv } from '../../../config/validate-env';

const env = validatedEnv;

// Ensure logs directory
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const fileTransport = new DailyRotateFile({
  filename: path.join(logDir, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
});

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      ({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`
    )
  ),
  transports: [
    fileTransport,                                           // file logs :contentReference[oaicite:1]{index=1}
    new winston.transports.Console({                         // console logs :contentReference[oaicite:2]{index=2}
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Handle uncaught exceptions & rejections
logger.exceptions.handle(fileTransport);
logger.rejections.handle(fileTransport);
