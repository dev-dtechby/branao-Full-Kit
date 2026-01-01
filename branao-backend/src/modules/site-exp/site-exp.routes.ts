import { Router } from "express";
import {
  createSiteExpense,
  getAllSiteExpenses,
  getExpensesBySite,
  updateSiteExpense,
  deleteSiteExpense,
} from "./site-exp.controller";

const router = Router();

/**
 * =========================================================
 * SITE EXPENSE ROUTES
 * Base Path: /api/site-exp
 * =========================================================
 */

/**
 * @route   POST /api/site-exp
 * @desc    Create new site expense
 */
router.post("/", createSiteExpense);

/**
 * @route   GET /api/site-exp
 * @desc    Get all site expenses (ACTIVE ONLY)
 */
router.get("/", getAllSiteExpenses);

/**
 * @route   GET /api/site-exp/site/:siteId
 * @desc    Get expenses for a specific site (ACTIVE ONLY)
 */
router.get("/site/:siteId", getExpensesBySite);

/**
 * @route   PUT /api/site-exp/:id
 * @desc    Update a site expense (EDIT)
 */
router.put("/:id", updateSiteExpense);

/**
 * @route   DELETE /api/site-exp/:id
 * @desc    Soft delete a site expense (MOVE TO RECYCLE BIN)
 */
router.delete("/:id", deleteSiteExpense);

/* =========================================================
   FUTURE / ADMIN ROUTES (READY BUT OPTIONAL)
   Uncomment when needed
========================================================= */

/*
import {
  restoreSiteExpense,
  hardDeleteSiteExpense,
} from "./site-exp.controller";

router.patch("/:id/restore", restoreSiteExpense);
router.delete("/:id/hard", hardDeleteSiteExpense);
*/

export default router;
