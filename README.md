Queries raw SQL icloud contacts info such as name and phone number and returns the data in a promise.

ATTENTION: Heavy development going on.

## Install

```
  npm install icloud-addressbook
```

## Usage

Node.JS Library

```
var AddressBook = require('icloud-addressbook')
var ab = new AddressBook
var User = require('PATH_TO_USER_MODEL')

// Query all icloud contacts (returns a promise) and .then
ab.fetchContacts()
  .then(function(contacts) {
    // Do stuff with contacts here.  Contacts is an array.
    console.log("Here are your contacts: ", contacts)

    // Example usage below: mapping through contacts and storing the data into my own SQL Database if the contact has a phone number.

    return Promise.all(contacts.map((elem) => {

        if (elem.ZFULLNUMBER) {
          return User.findOrCreate(
            {
              defaults: { ZFIRSTNAME: elem.ZFIRSTNAME, ZLASTNAME: elem.ZLASTNAME, ZFULLNUMBER: elem.ZFULLNUMBER },
              where: { ZFULLNUMBER: elem.ZFULLNUMBER.replace(/[^0-9]/g, '').slice(-10) }
            }
          )
        }
      }))
    })
```
