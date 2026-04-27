/**
 * actions.ts
 * 
 * This file has been refactored into a Domain-Driven Architecture.
 * It now acts as a facade, re-exporting all server actions from their respective domain modules.
 * This ensures backward compatibility while providing modularity and better Next.js Compiler support.
 */

export * from "./reader-actions";
export * from "./billing-actions";
export * from "./seat-actions";
export * from "./content-actions";
export * from "./admin-actions";
export * from "./student-actions";
