const express = require('express');
const path = require('path');
const session = require('express-session');
const uuid = require('uuid/v4');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const db = require('../database/index');
const { sequelize, Account, Listing, Artist } = require('../database/config');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const axios = require('axios');

/**
 * PASSPORT SETUP
 */
passport.use(new LocalStrategy((username, password, done) => {
  Account.findOne({ where: { username: username }})
    .then((account) => {
      if (!account) {
        return done(null, false, {message: 'Unknown User'});
      }
      bcrypt.compare(password, account.password)
        .then((isValid) => {
          if (isValid) {
            return done(null, account);
          } else {
            return done(null, false, {message: 'Invalid password'});
          }
        })
    })
}))

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  Account.findOne({ where: {id: id}})
    .then((account) => {
      done(null, account);
    })
    .catch((err) => {
      done(err, false);
    })
})
/**
 * END PASSPORT SETUP
 */

// Imports environment variables from the .env file
require('dotenv').config();

/**
 * EXPRESS SERVER SETUP
 */
const app = express();
app.use(express.static(path.join(__dirname, '../dist')));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
/**
 * END EXPRESS SERVER SETUP
 */


/**
 * EXPRESS-SESSION SETUP
 */
const sessionStorage = new SequelizeStore({
  db: sequelize,
});

app.use(session({
  genid: (req) => {
    return uuid()
  },
  store: sessionStorage,
  secret: 'papa watzke sucks',
  // need to change this secret in production to a rand string as an env variable
  resave: false,
  saveUninitialized: true
}));
/**
 * END EXPRESS-SESSION SETUP
 */


// Passport Initialization
app.use(passport.initialize());
app.use(passport.session());

/**
 * LISTINGS ENDPOINTS
 */

// Gets all listings
app.get('/listings', (req, res) => {
  db.getListings()
    .then((listings) => {
      res.send(listings);
  })
  .catch((err) => {
    console.error(err);
    res.send(500);
  })
});

//Gets artist info for a specific listing by listingId
app.get('/listings/contact', (req, res) => {
  const {id} = req.query;
  Listing.findOne({ where: {id}})
    .then(listing => Artist.findOne({ where: {id: listing.artistId}}))
    .then((artist) => {
      res.send(artist);
  })
  .catch(err => {
    console.error(err);
    res.sendStatus(500);
  })
});

//Creates a new listing, using the logged in user's id as the artistId for the listing
app.post('/listings', (req, res) => {
  const newListing = req.body;
  if(req.isAuthenticated()) {
    Account.findOne({ where: {id: req.user.id}})
      .then(account => account.getArtist())
      .then(artist => db.makeListing(artist.id, newListing))
      .then(() => {
        res.sendStatus(201);
      })
      .catch(err => {
        console.error(err);
        res.sendStatus(500);
      })
  } else {
    res.sendStatus(403);
  }
});
/**
 * END LISTINGS ENDPOINTS
 */


/**
 * ARTIST ENDPOINTS
 */
//Gets all artists' info
app.get('/artist', (reg, res) => {
  db.getAllArtists()
  .then((artists) => {
    res.send(artists)
  })
  .catch(err => {
    console.error(err);
    res.send(500);
  })
});

// Gets artist info by artist's name
app.get('/artist/:artistname', (req, res) => {
  const { artistname } = req.params;
  Artist.findOne({ where: {name: artistname}})
    .then(profile => {
      res.send(profile);
    })
    .catch(err => {
      res.sendStatus(500);
    })
});

// Updates the artist info for the currently logged in account
app.patch('/artist', (req, res) => {
  const details = req.body;
  if(req.isAuthenticated()) {
    Account.findOne({ where: {id: req.user.id}})
      .then(account => {
        return account.getArtist()
      })
      .then(artist => db.updateArtistDetails(artist.id, details))
      .then(() => {
        res.sendStatus(201);
      })
      .catch(err => {
        console.error(err);
        res.send(500);
      })
  } else {
    res.sendStatus(403);
  }
});
/**
 * END ARTIST ENDPOINTS
 */

/**
 * AUTHENTICATION ENDPOINTS
 */
//Creates a new account and logs in that account
app.post('/signup', (req, res) => {
  const { password1, password2, username, email, solo, contact_email, city, name } = req.body;
  if(!password1 || !username || !email || solo === undefined || !contact_email || !city || !name){
    res.status(500).send("Please give all required information");
  } else if (password1 === password2) {
    axios.get(`https://api.trumail.io/v2/lookups/json?email=${email}`)
      .then(emailVal => {
        return axios.get(`https://api.trumail.io/v2/lookups/json?email=${contact_email}`)
        .then(contactEmailVal => {
          if(!emailVal.validFormat && !contactEmailVal.validFormat) {
            res.send(`Invalid email format`);
          } else if (!emailVal.hostExists && !contactEmailVal.hostExists) {
            res.send(`Invalid host`);
          } else if (emailVal.deliverable && contactEmailVal.deliverable) {
            const newAccount = {
              username,
              email,
              password: password1,
              solo,
              city,
              name,
              contact_email,
            };
            db.makeAccount(newAccount)
              .then(account => db.makeArtist(account.id, newAccount)
                .then(() => {
                  req.login(account, (err) => {
                    if (err) throw err;
                    res.send('success')
                  });
                })
              )
              .catch((error) => {
                res.status(500).send("Account already exists!");
              })
          } else {
            res.send(`invalid email`);
          }
        })
      })
  } else {
    res.status(500).send("Passwords don't match!");
  };
});

app.patch('/artist', (req, res) => {
  const details = req.body;
  console.log(details);
  if(req.isAuthenticated()) {
    db.getAccountInformation({id: req.user.id})
      .then(account => account.getArtist())
      .then(artist => db.updateArtistDetails(artist.id, details))
      .then(() => {
        res.sendStatus(201);
      })
      .catch(err => {
        console.error(err);
        res.send(500);
      })
  } else {
    res.sendStatus(403);
  }
});

// Logs in an account (requires a username and password)
app.post('/login', passport.authenticate('local', { successRedirect: "/success", failureRedirect: "/failure" }));

// Logs out an account
app.post('/logout', (req, res) => {
  req.logout();
  res.send('success');
})

// A successful login redirects here, letting the client know that the login was successful.
app.get('/success', (req, res) => {
  res.send('Logged in!');
})

// A failed login redirects here, letting the client know that the login was unsuccessful.
app.get('/failure', (req, res) => {
  res.send('Failed to log in');
})

// Tells the client whether or not the user is currently logged in.
app.get('/checkauth', (req, res) => {
  if (req.isAuthenticated()) {
    console.log(req.user);
    const userId = req.user.id;
    Artist.findOne({where:{accountId: userId}})
      .then((artist) => {
        res.send(artist);
      })
  } else {
    res.send("false");
  }
});
/**
 * END AUTHENTICATION ENDPOINTS
 */


/**
 * SERVER INITIALIZATION
 */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});