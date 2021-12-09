const validate = require("../models/store");
const Store = require("../models/store");
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
		                                                                                 
router.get('/', async (req, res) => {
  var response = {};
  Store.find({}, function(err,data){
    if(err) {
      response = {"error" : true,"message" : "Error fetching data"};
      res.status(400).json(response);
    } else {
      response = {"stores" : data};
      res.json(response);
    }
  });
});


router.get('/:id', async (req, res) => {
  const shop = await Store.findById(req.params.id);

  if (!shop) return res.status(404).json('The shop with the given ID was not found.');

  res.json(shop);
});


router.post('/', auth, async (req, res) => { //execute middleware auth function before the route handler
  const { error } = validate(req.body); 
  if (error) return res.status(400).json(error.details[0].message);

  var shop = new Store({ 
    name: req.body.name,
    brand: req.body.brand,
    phone: req.body.phone,
    email: req.body.email,
    username: req.body.email,
    brand: req.body.brand,
    location: req.body.location,
    lng: req.body.lng,
    lat: req.body.lat,
  });
  shop = await shop.save();
  
  res.json(shop);
});


router.put('/:id', auth, async (req, res) => {
  const { error } = validate(req.body); 
  if (error) return res.status(400).json(error.details[0].message);

  const shop = await Store.findByIdAndUpdate(req.params.id, 
    { 
      name: req.body.name,
      brand: req.body.brand,
      phone: req.body.phone,
      email: req.body.email,
      username: req.body.email,
      location: req.body.location,
      lng: req.body.lng,
      lat: req.body.lat,
     }, {new: true});

  if (!shop) return res.status(404).json('The shop with the given ID was not found.');
  
  res.json(shop);
});


router.delete('/:id', [auth, admin], async (req, res) => { //execute both middlwares auth, admin so that only admins can delete 
  const shop = await Store.findByIdAndRemove(req.params.id);

  if (!shop) return res.status(404).json('The shop with the given ID was not found.');

  res.json({"message" : "ok"});
});



module.exports = router;
