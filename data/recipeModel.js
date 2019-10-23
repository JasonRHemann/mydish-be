const db = require("./dbConfig.js");

module.exports = {
    insertRecipe,
    allRecipes,
    findRecipeById,
    findByTitle    
}


function insertRecipe(recipe) {
    return db("recipes").insert(recipe);
  }

  function allRecipes() {
      let recipe = db("recipes")
    return db("recipes");
  }
  
  function findRecipeById(id) {
     return db("recipes as r")
        .where({ 'r.id': id })
        .join('steps as s', 's.recipe_id', "r.id" )
        .select('*').from('steps')
  }
  
  function findByTitle(title) {
    return db("recipes").where({ title }).first();
  }
  