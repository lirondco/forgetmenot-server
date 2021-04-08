# FORGETMENOT APP SERVER

This is the server I'm using for my Capstone Project. It stores data for lists, ideas, and user information. 

## FETCH REQUESTS

Base URL: https://calm-bayou-27862.herokuapp.com/api

/users

POST - create new users. Must have a username, password, and a valid email address. Additionally, passwords must not start or end with empty spaces, less than 72 characters, and must contain at least one upper case, lower case, number, and special character each.

/auth/login

POST - acquire a token by supplying a valid username and password. 

/lists

GET - returns lists owned by the user. 

POST - adds a new list. Must have a 'name' and an optional 'theme', which is an unimplemented styling feature. 

PATCH - modifies a list and its theme.

/lists/:list_id

GET - returns specific list but only if it's owned by the owner. 

/lists/:list_id/ideas

GET - returns all ideas under that list

/ideas

POST - adds a new idea to a list. Must have a 'name', 'content', and an existing 'list_id'

PATCH - modifies an idea.
