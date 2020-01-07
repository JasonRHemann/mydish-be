const router = require("express").Router();
const Recipes = require("../data/recipeModel.js");
const mid = require("../middleware/cookMiddleware.js");
const cookbook = require("../data/cookbookModel.js");

//all recipes
router.get("/all", (req, res) => {
  Recipes.allRecipes()
    .then(x => {
      res.status(200).json(x);
    })
    .catch(err => {
      res.status(501).json(err);
    });
});

//search by title
router.get("", (req, res) => {
  const getFun = req.query.title ? Recipes.searchByTitle : Recipes.allRecipes;
  getFun(req.query.title)
    .then(dbRes => {
      res.status(200).json(dbRes);
    })
    .catch(err => res.status(501).json(err));
});

//single recipe
router.get("/:id", (req, res) => {
  Recipes.findRecipeById(req.params.id)
    .then(x => {
      res.status(200).json(x);
    })
    .catch(err => {
      res.status(501).json(err);
    });
});

//delete a recipe
router.delete("/:id", mid.restrict, (req, res) => {
  Recipes.deleteById(req.params.id, req.cook.id)
    .then(() => {
      res.status(204).end();
    })
    .catch(err => {
      res.status(501);
    });
});

//post a new recipe
router.post("/", mid.restrict, async (req, res) => {
  const missing = [];
  const validRecipe = { innovator: req.cook.id };

  // required fields
  ["title", "ingredients", "steps", "categories"].forEach(field => {
    if (field in req.body) {
      validRecipe[field] = req.body[field];
    } else {
      missing.push(field);
    }
  });

  if (missing.length > 0) {
    // abort if required fields missing
    res.status(400).json({ message: `missing required fields: ${missing}` });
  } else if (!req.body.title) {
    res.status(400).json({ message: "missing title for the recipe" });
  } else {
    // optional fields
    ["notes", "ancestor", "minutes", "img"].forEach(field => {
      if (field in req.body) {
        validRecipe[field] = req.body[field];
      }
    });

    try {
      const recipeId = await Recipes.insertRecipe(validRecipe);
      cookbook
        .cookbookInsert(recipeId, req.cook.id)
        .then(dbRes => {
          res.status(201).json({
            message: "Recipe created",
            recipe_id: recipeId
          });
        })
        .catch(err => {
          console.log(err);
          res.status(501).send(err);
        });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Error creating recipe", err });
    }
  }
});

//update a new recipe
router.put("/", mid.restrict, async (req, res) => {
  if (!req.body || !req.body.innovator) {
    return res
      .status(400)
      .json({
        message: "To update a recipe, the recipe must have an creator",
        missing: "innovator"
      });
  }
  if (req.body.innovator !== req.cook.id) {
    return res
      .status(403)
      .json({
        message:
          "You do not have permission to edit this recipe. Please edit a recipe you have created."
      });
  }
  const missing = [];
  const validRecipe = { innovator: req.body.innovator };

  // required fields
  ["title", "ingredients", "steps", "categories", "id"].forEach(field => {
    if (field in req.body) {
      validRecipe[field] = req.body[field];
    } else {
      missing.push(field);
    }
  });

  if (missing.length > 0) {
    // abort if required fields missing
    res.status(400).json({ message: `missing required fields: ${missing}` });
  } else if (!req.body.title) {
    res.status(400).json({ message: "missing title for the recipe" });
  } else {
    // optional fields
    ["notes", "ancestor", "minutes", "img"].forEach(field => {
      if (field in req.body) {
        validRecipe[field] = req.body[field];
      }
    });

    try {
      const success = await Recipes.updateRecipe(validRecipe);
      if (success) {
        res.status(200).json({
          message: "Recipe updated",
          recipe_id: req.body.id
        });
      } else {
        res.status(404).json({
          message: "We couldn't find a recipe to update with this id"
        });
      }
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Error updated recipe", err });
    }
  }
});

module.exports = router;
