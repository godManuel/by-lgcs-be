const express = require("express");
const router = express.Router();

const {
  registerSuperAdmin,
  addAdmin,
  addCoordinator,
  getAllAdmins,
  updateAdmin,
  removeAdminAreas,
  fixServiceArea,
  deleteAdmin,
  deleteCoordinator,
} = require("../controllers/users");

const { protect, authorize } = require("../middlewares/auth");

// @POST - Create SuperAdmin
router.route("/register-superadmin").post(registerSuperAdmin);

/**
 * @swagger
 * components:
 *  schemas:
 *    User:
 *      type: object
 *      required:
 *          - email
 *          - password
 *      properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of a user
 *         email:
 *           type: string
 *           description: The email address of a user
 *         password:
 *           type: string
 *           description: The password of a user
 *         firstName:
 *          type: string
 *          description: The first name of a user
 *         lastName:
 *          type: string
 *          description: The last name of a user
 *         assignedRDAs:
 *          type: array
 *          items:
 *            type: string
 *          description: The assigned RDA of a user
 *         assignedLGAs:
 *          type: array
 *          items:
 *            type: string
 *          description: The assigned LGA of a user
 *      example:
 *        id: 67eee18f085f05c65793ebcb
 *        email: johndoe@gmail.com
 *        password: 123456
 *        firstName: John
 *        lastName: Doe
 *        assignedRDAs: ['peremabiri', 'southern-ijaw']
 */

/**
 * @swagger
 * tags:
 *  name: Users
 *  description: The users managing API
 *
 */

/**
 * @swagger
 * /users/add-admin:
 *  post:
 *    summary: Create a new admin
 *    tags: [Users]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/User'
 *    responses:
 *      200:
 *        description: Admin successfully created
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/User'
 *      500:
 *        description: Some server error
 */
// @POST - Add Admin
router.route("/add-admin").post(protect, authorize("superadmin"), addAdmin);

// @POST - Add Coordinator
router
  .route("/add-coordinator")
  .post(protect, authorize("admin"), addCoordinator);

router.route("/admins").get(protect, authorize("superadmin"), getAllAdmins);

router.route("/admins").put(protect, authorize("superadmin"), updateAdmin);

router
  .route("/admins/remove-areas")
  .put(protect, authorize("superadmin"), removeAdminAreas);

router.route("/update-service-areas").put(fixServiceArea);

router.route("/admins/").delete(protect, authorize("superadmin"), deleteAdmin);

router
  .route("/coordinators/:id")
  .delete(protect, authorize("admin"), deleteCoordinator);

module.exports = router;
