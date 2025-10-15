/**
 * Food Finder MCP Server - Exports
 *
 * Export tool functions for orchestrator to import directly.
 * Enables direct tool calling pattern (Option B architecture).
 *
 * These functions can be imported by the orchestrator server:
 * import { findRestaurants, getRestaurantDetails, ... } from '../food-finder/src/exports.js';
 */

export {
  findRestaurants,
  getRestaurantDetails,
  checkDietarySafety,
  matchRestaurantToActivity,
} from './index.js';
