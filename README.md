# Board Market
Deployed on [board-market.onrender.com](https://board-market.onrender.com)

This project consists of a marketplace where people can upload their Surfboards. Specific details (brand, model, litres, length, condition etc) about the board
will be entered when uploading using the form and then people will be able to search for
boards in their area using the google maps API to filter based on proximity.

## Features
### Map (Google Maps)
The application has a map what allows the user to set their locatio using the google maps API. 
This was implemented because it will make it easy for users to setup their search based on location. This is also used when listing a new board.

### Board Search
Users can search a board based on distance from **my location** and also includes a list of filters for **board attributes**.
This was done so users could find the boards that match their needs faster.

### User accounts
Users can create their own accounts where they can list their boards, modify or delete. Also having an account allows a user to favourite boards to keep track of them. Logged in users are able to message other users regarding their listed boards.
This was implemented to maintain all the user information and their interests in an organized fashion.

### Board Listing
This includes a form where a user can specify all the attributes of a new board to be listed. This includes the option to add multiple images and select a specific location. The user is able to edit or delete the listed board later using a similar form structure.
This was implemented as a way to allow the listing of boards and change any details that might have been introduced wrong.

### Email messaging
The users can message a user about a specific board. This will generate an email with the contacting user's information and the message.
This was implemented because it will allow users to establish a first way of communication, and the later sale can be solved outside the website.

## Website or user flow explanation

### Homepage
- In the `Homepage` the user is greeted with a map and asked to choose a location. 
- Then has the options to either `List a Board` or `Search for a Board`. 
- There is also a header with links to these sections and also links to `Login` or `Register` if the user is not logged in.
- If the user is logged in, these options will change into **logout** and `My Profile`.
- From here the user can move to the following pages:
    - `List a Board`
    - `Search for a Board`
    - `Login/Register`
    - `User Profile`

### Search Board Page
- Users can search for boards without authentication, they only need to set their location.
- Users are able to use a search form to specify board attributes or the proximity of the seller.
- When hovering over a board it shows more info about this board.
- When clicking on a board this will redirect to the `Board Profile`.
- When clicking favourite it will save the board in favourites if the user is logged in, if it's not logged in this will redirect to `Login/Register`.

### Board Profile/Details Page
- In this page the user can see all the details of a board.
- If the board belongs to them, it shows options to **Edit** or **Delete** the board. These will take you to the `Board Edit` page, or will delete the board and return to the `Search for a Board` page.
- If the board is not theirs, then it shows the option to **Favourite** and the option to `Contact` the user. The first will save the board in the user's favourite boards, the second will redirect to the `Contact` page. If the user is not logged in, either of them will take the user to `Login/Register`.
- The board details include a link to the seller, clicking this will redirect to the `User Profile` page.

### Contact Page
- This will ask the user to fill in a form to include the message to send.
- After submitting, the seller should receive an email with the sender's details, the message and the board's details.
- After that you're redirected to the `Homepage`

### Register/Login page
- To register the user needs to fill in a form with all their details.
- To login it's a form that requires the user's credentials.
- After either of them, the user is logged in and redirected to the `Homepage`.

### User Profile page
- Here there will be all the user's basic information, as well as the surfboards they have listed and their favourite boards showing up in a list.
- If a user is visiting their own page they will have the option to go to `User Profile Edit`.

#### User Profile Edit page
- This will allow any user to edit their information or change their password.
- This will redirect back to the `User Profile` page.

### Board Listing page
- This page has a form that asks the user to fill in all the details of a board they want to list.
- After submitting you go back to the `Homepage`.

### Board Edit page
- This displays a similar form to the previous one, but will all the info alredy filled in as it currenly is listed.
- The user can modify anything here and save that for the listed board.
- After submitting the user is taken back to the `Board Profile` page.


## APIs used
- [Mapbox API](https://www.mapbox.com/)
    
    Used for the location functionality when listing or searching for boards.

- [Google Cloud Storage API](https://cloud.google.com/storage/docs/apis)
    
    Used to store the photos of the users and boards created in the application.

## Technologies used
- [Flask](https://flask.palletsprojects.com/en/3.0.x/)

    Used as the main backend framework.

- [PostgreSQL](https://www.postgresql.org/)

    Used as the database.

- [JQuery](https://jquery.com/)

    Used in API requests.

- [Render](https://render.com/)

    Used to host the backend service.

- [Supabase](https://supabase.com/)

    Used to host the database service.
