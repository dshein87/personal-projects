/**
 * Exports for Orchestrator MCP Server
 *
 * This file exports all Schedule Sync tool functions so they can be imported
 * and called directly by the Orchestrator for direct tool calling.
 *
 * Usage in Orchestrator:
 *   import {
 *     checkCalendarConflicts,
 *     getWeatherForecast,
 *     calculateDriveTime,
 *     suggestTiming
 *   } from '../schedule-sync/src/exports.js';
 */

export {
  checkCalendarConflicts,
  getWeatherForecast,
  calculateDriveTime,
  suggestTiming,
} from './index.js';
