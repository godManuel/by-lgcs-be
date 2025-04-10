const express = require("express");
const router = express.Router();

const upload = require("../utils/multer");

const {
  addCivilServant,
  getCivilServant,
  getCivilServants,
  updateCivilServant,
} = require("../controllers/servants");

const { protect, authorize } = require("../middlewares/auth");

const advancedResults = require("../middlewares/advancedResults");
const Servant = require("../models/Servant");

/**
 * @swagger
 * components:
 *   schemas:
 *    Servant:
 *      type: object
 *      required:
 *        - serviceRegion
 *        - serviceArea
 *        - displayPhoto
 *        - firstName
 *        - lastName
 *        - sex
 *        - dateOfBirth
 *        - originLGA
 *        - firstApptDate
 *        - lastPromDate
 *        - retireDate
 *        - qualification
 *        - currentRank
 *        - currentGradeLevel
 *      properties:
 *        id:
 *          type: string
 *          description: The auto-generated id of a civil servant
 *        serviceRegion:
 *          type: string
 *          description: The region of service either RDA or LGA
 *        serviceArea:
 *          type: string
 *          description: The specific area of service in a region
 *        displayPhoto:
 *          type: string
 *          description: The photo of a civil servant
 *        firstName:
 *          type: string
 *          description: The first name of a civil servant
 *        lastName:
 *          type: string
 *          description: The last name of a civil servant
 *        sex:
 *          type: string
 *          description: The gender of a civil servant
 *        dateOfBirth:
 *          type: date
 *          description: The birth date of a civil servant
 *        originLGA:
 *          type: string
 *          description: The LGA of origin of a civil servant
 *        firstApptDate:
 *          type: date
 *          description: The date of the first appointment of a civil servant
 *        lastPromDate:
 *          type: date
 *          description: The date of the last promotion of a civil servant
 *        retireDate:
 *          type: date
 *          description: The date of retirement of a civil servant
 *        qualification:
 *          type: string
 *          description: The academic qualification of a civil servant
 *        currentRank:
 *          type: string
 *          description: The current rank of a civil servant
 *        currentGradeLevel:
 *          type: string
 *          description: The current grade level of a civil servant
 *      example:
 *        id: 67eee18f085f05c65793ebcb
 *        serviceRegion: rda
 *        serviceArea: Anyama(OGBIA)
 *        displayPhoto: http://res.cloudinary.com/dlastotbq/image/upload/v1744145524/ef9osngyoo8akg6hbtxh.jpg
 *        firstName: Alawei
 *        lastName: Dennis
 *        sex: male
 *        dateOfBirth: 1989-07-15
 *        originLGA: Yenagoa
 *        firstApptDate: 2004-05-15
 *        lastPromDate: 2000-10-20
 *        retireDate: 2030-01-01
 *        qualification: ssce
 *        currentRank: Senior Account
 *        currentGradeLevel: GL-8
 */

/**
 * @swagger
 * tags:
 *  name: Civil Servants
 *  description: The civil servants managing API
 *
 */

/**
 * @swagger
 * /civil-servants:
 *  post:
 *    summary: Create a new civil servant record
 *    tags: [Civil Servants]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Servant'
 *    responses:
 *      200:
 *        description: The civil servant record was successfully created
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Servant'
 *      500:
 *        description: Some server error
 */
router
  .route("/")
  .post(
    protect,
    authorize("superadmin", "admin"),
    upload.single("displayPhoto"),
    addCivilServant
  );

/**
 * @swagger
 * /civil-servants:
 *  get:
 *    summary: Returns the list of all the civil-servants with advanced filtering
 *    tags: [Civil Servants]
 *    responses:
 *      200:
 *        description: The list of all the civil-servants
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/Servant'
 */
router
  .route("/")
  .get(
    protect,
    authorize("superadmin", "admin"),
    advancedResults(Servant),
    getCivilServants
  );

// @GET - Fetch a single Civil Servant
router
  .route("/:servantId")
  .get(protect, authorize("superadmin", "admin"), getCivilServant);

/**
 * @swagger
 * /civil-servants/{id}:
 *  put:
 *    summary: Update a civil servant record by the id
 *    tags: [Civil Servants]
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: The civil servant id
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Servant'
 *    responses:
 *      200:
 *        description: The civil servant record was updated
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Servant'
 *      404:
 *        description: The book was not found
 *      500:
 *        description: Some error happened
 */
router
  .route("/:servantId")
  .put(protect, authorize("superadmin", "admin"), updateCivilServant);

module.exports = router;
