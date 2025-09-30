1. The given data for a person:
- Name
- Face Image
- Face ID, which has embeddings (to be used in ML part later)
- Email
- Department
- Faculty/Student/Staff
- Student ID/ Staff ID
- Location ID with timestamp (from this we know where the person with card ID x was at the time)
- Card ID
- (WiFI) Device Hash, which has association logs (Ap_ID - from where we can get the location of the device, timestamp)

2. For Camera:
- Frame ID
- CCTV location ID
- Timestamp
- Face ID (with missing values)

3. Lab Bookings (records of a given Lab):
- Room ID
- Start and End timestamps of booking the lab/location
- Attended it (yes/no)

Entity ID is key- link to many components. It is the unique ID of a person.

**What each data file gives us:**

CCTV Frames - From here we get the Face of a person, along with the location and the time of the image. Note that face IDs are incomplete (some values are missing).

Card Swipes- We know the time and location of a card swipe, hence we know the person too because in a later file we have the entity id (person) with the corresponding card ID. 

Free text notes/helpdesk- Here we have some actions/requests made by a known person along with the timestamp. (Can we deduce anything from this file though??)

Lab bookings- A room was booked by a person from a start to end timestamp. We have room id (in a way location), booking id (useless?) and entity id. However, they either did or did not attend it. If attendance is a yes, then the person was in that room from start to end. 

Library Checkouts- Contains IDs of the checkout (useless?), book and entity (person), along with the timestamp. (Reasonable to think that the person would have spent some time in the library before the checkout timestamp, for example for an hour before checkout time they would be in the library). Between two checkout times of the same book, the person should have been in the library for some time.

Student or Staff profiles- Has the summary of a person. Entity ID, Name, Face ID, Card ID, Email (useless??), Role (Staff/Student/Faculty), Student ID OR Staff ID (useless?), Department (possible location?) and Device Hash.

Wifi association logs- Device Hash, ap_ID, timestamp. From here we understand which device was where (from the ap_id) at what time, hence we also know that the person was here at that time. 


