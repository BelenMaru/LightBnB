const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');




const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});
pool.connect()

/// Users
/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool.query (
  `SELECT * 
  FROM users 
  WHERE users.email = $1`,[`${email}`])
  .then (result => result.rows[0])
  .catch((err) => console.log('err.message',err));

};
exports.getUserWithEmail = getUserWithEmail;

// let user;
  // for (const userId in users) {
  //   user = users[userId];
  //   if (user.email.toLowerCase() === email.toLowerCase()) {
  //     break;
  //   } else {
  //     user = null;
  //   }
  // }
  // return Promise.resolve(user);

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool.query(`SELECT * FROM users WHERE id = $1`, [id])
  .then((result) => {
    return(result.rows);
  })
  .catch((err) => console.log(err.message))
  
}
exports.getUserWithId = getUserWithId;
// return Promise.resolve(users[id]);

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  return pool.query(`INSERT INTO users (name, email, password) VALUES ($1,$2,$3) RETURNING *;`, [`${user.name}`,`${user.email}`,`${user.password}`])
  .then(result => console.log(result))
  .catch((err)=> console.log(err.message));
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  // return getAllProperties(null, 2);
  return pool
  .query(
    `SELECT properties.*, reservations.*, avg(rating) as average_rating
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE reservations.guest_id = $1
    AND reservations.end_date < now()::date
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date
    LIMIT $2;`
    , [`guest_id`, limit])
    .then(result => result.rows)

    .catch((err => console.log('query error', err.msg)));
};


exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  // Setup an array to hold any parameters that may be available for the query.
  const queryParams = [];


  // Start the query with all information that comes before the WHERE clause.
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // Check if any city, owner_id, minimum or maximum price  per night, min-rating are passed in option. Add them to param and create WHERE clause
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    // console.log("🎈City queryParams length: ", queryParams.length)
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    queryParams.push(options.owner_id);
    if (queryParams.length === ) {
      queryString += `AND $${queryParams.length}`;
    } else if (queryParams.length === ){
      queryString +=  `WHERE  $${queryParams.length}`;
    }
  }

  if (options.minimum_price_per_night) {
    queryParams.push() ;
    queryString += `AND  $${queryParams.length} `;
  }

  if(options.maximum_price_per_night) {
    queryParams.push(options.maximum_price_per_night) ;
    queryString += `AND properties.cost_per_night <= $${queryParams.length} `
  }

  if (options.minimum_rating) {
    queryParams.push();
    havingClause = `HAVING avg(property_reviews.rating) >= $${queryParams.length}`;
  }

  // Add any query that comes after the WHERE clause.
  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id;
  HAVING
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

};

exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;
