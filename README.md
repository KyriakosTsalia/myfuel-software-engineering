# MyFuel: Full-stack Fuel Price Observatory Application

Disclaimer: The application was developed in Greek, thus all UIs as well as much of the technical documentation are in Greek. 

The goal of this project is to create a crowdsourcing application centered around fuel, providing the most afforable prices found around different gas stations. Users can search for offers for all major fuel types and sort the results according to a number of different factors (date, price, etc.). The search is based on the user's location and can be customized to include offers within and up to a 5km radius. Enrolled users have additional priviledges, some of which are: 
* adding new posts
* rating and leaving comments under posts
* saving "user locations" for quick searches
* earning points and redeeming them for exclusive sales
* monitoring the trend of each gas price based on the users' posts

To enable the point redemption system and apply some ideas from the concept of <a href="https://en.wikipedia.org/wiki/Gamification">Gamification</a>, a second user-type is created: the "Store" user. For simplicity, this user's username is the email of the gas station and their password is the first part of the email until the '@' character. This type of user doesn't have the priviledges of enrolled users and its sole purpose is to redeem their points. A user earns 100 points for every offer they post (of course, these points are deducted if the offer is deleted). When they reach the thresold of 2000 points, then they are able to initiate the redemption process. Their current point total can be checked from their profile page. To redeem points, they enter the desired amount and then receive an email with a QR code. This QR code can subsequently be scanned from a "Store" user account (using a phone or any other QR scanner) to receive prizes or pay a reduced amount.

As a way to increase the users' accountability and avoid any garbage posting, the review system can be used to rank users and always choose the posts which are most likely to be accurate. Furthermore, the application admins have the ability to block certain users for a specified period and, in doing so, take away all their priviledges.

The project started from the ground up and followed all stages of the software engineering workflow, like conceptualization, software requirements specification, stakeholders requirements specification, UML/Class/Sequence/ER diagrams, testing and continuous development. A more in-depth technical overview can be found [here](TECHNICAL_OVERVIEW.md).

## Running this application
To run this application and avoid installing any libraries and dependencies, Docker needs to be installed. Download instructions for all platforms can be found <a href="https://docs.docker.com/get-docker/">here</a>.

After cloning this repository, you need to create a `.env` file inside the `src` directory. There, the environment variables that will be referenced from inside the source code will be declared and given a value (e.g. VAR_NAME=VALUE). These are: 
* ADMIN_CODE: to differentiate the admins from the simple users when registering
* GMAILADDRESS: gmail account used to send emails (e.g. for password reset)
* GMAILPW: password of the gmail account
* GEOCODER_API_KEY: API key used for Google Maps API
* CLOUDINARY_NAME: account name for cloudinary (to store users' profile pictures)
* CLOUDINARY_API_KEY: key for cloudinary
* CLOUDINARY_API_SECRET: secret for cloudinary

Alternatively, these environment variables can be declared in the "environment" section of the `app` service inside the `docker-compose.yml` file.


Finally, navigate to the root directory and execute the following command:
```shell
sudo docker-compose up --build
```
Similarly, to shut the application down, execute the following command:
```shell
sudo docker-compose down
```

***
## License
Copyright &copy; 2019 Kyriakos Tsaliagkos

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
