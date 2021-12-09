//-----------------------
//FOR UNLEADED 95--------
//-----------------------

var sum = 0;
var counter = 0;
db.posts.find({"fuelType":"UNLEADED 95"},{"price":1,"createdAt":1}).forEach(function(post){
//  print( post.createdAt+","+post.price);
  sum = parseFloat(sum) + parseFloat(post.price);
  counter = counter + 1;
 // print(counter);
});

print("\""+parseFloat(sum)/parseFloat(counter)+"\"");

//--------------------------
//FOR UNLEADED 100----------
//--------------------------
//
var sum = 0;
var counter = 0;
db.posts.find({"fuelType":"UNLEADED 100"},{"price":1,"createdAt":1}).forEach(function(post){
//  print( post.createdAt+","+post.price);
  sum = parseFloat(sum) + parseFloat(post.price);
  counter = counter + 1;
 // print(counter);
});

print("\""+parseFloat(sum)/parseFloat(counter)+"\"");

//----------------------
//FOR DIESEL------------
//----------------------

var sum = 0;
var counter = 0;
db.posts.find({"fuelType":"DIESEL"},{"price":1,"createdAt":1}).forEach(function(post){
//  print( post.createdAt+","+post.price);
  sum = parseFloat(sum) + parseFloat(post.price);
  counter = counter + 1;
 // print(counter);
});

print("\""+parseFloat(sum)/parseFloat(counter)+"\"");





