/* eslint-disable semi */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const Q = require('q');
const fs = require('fs');

const HOME = getUserHome();

function getUserHome() {
  var envVar = (process.platform == 'win32') ? 'USERPROFILE' : 'HOME';
  return process.env[envVar];
}

function AddressBook(opts) {
  opts = opts || {};
  this.path = opts.path || AddressBook.DB_PATH;
  this.db = this.connect();
}

/**
 * Must find the unique folder that holds the user's address book
 * Then find the filename ending in abcddb (should only be one)
 */
const pathToAddressBookDir = fs.readdirSync(path.join(HOME, `/Library/Application Support/AddressBook/Sources`))
  .filter(paths => {
    return paths[0] !== '.'
  })[0];

const pathToAddressBookDB = fs.readdirSync(path.join(HOME, `/Library/Application Support/AddressBook/Sources/${pathToAddressBookDir}`))
.filter((paths) => {
    return paths.slice(-6) === 'abcddb';
})[0];

AddressBook.OSX_EPOCH = 978307200;
AddressBook.DB_PATH = path.join(HOME, `/Library/Application Support/AddressBook/Sources/${pathToAddressBookDir}/${pathToAddressBookDB}`);

AddressBook.prototype.connect = function() {

  const deferred = Q.defer();

  const db = new sqlite3.Database(
    this.path,
    sqlite3.OPEN_READONLY,
    function(err, res) {
      if (err) return deferred.reject(err);
      return deferred.resolve(db);
    });

  return deferred.promise;
};

AddressBook.prototype.getDb = function(cb) {
  const args = arguments;

  this.db
    .then(function(db) {
      cb(null, db);
    }, function(err) {
      cb(err);
    });
};

AddressBook.prototype.getContacts = function(string, cb) {
  if (typeof string == 'function') {
    cb = string;
    string = false;
  }
  this.db.done(function(db) {
    let where = "";
    // Maybe dangerous, check SQLlite doc
    if (string && string != "") where = " WHERE id LIKE '%"+string+"%'";
    return db.all("SELECT DISTINCT ZABCDRECORD.ZFIRSTNAME, ZABCDRECORD.ZLASTNAME, ZABCDPHONENUMBER.ZFULLNUMBER FROM ZABCDRECORD LEFT JOIN ZABCDPOSTALADDRESS on ZABCDRECORD.Z_PK = ZABCDPOSTALADDRESS.ZOWNER LEFT JOIN ZABCDNOTE ON ZABCDRECORD.Z_PK = ZABCDNOTE.ZCONTACT LEFT JOIN ZABCDPHONENUMBER ON ZABCDRECORD.Z_PK = ZABCDPHONENUMBER.ZOWNER LEFT JOIN ZABCDRELATEDNAME ON ZABCDRECORD.Z_PK = ZABCDRELATEDNAME.ZOWNER LEFT JOIN ZABCDURLADDRESS ON ZABCDRECORD.Z_PK = ZABCDURLADDRESS.ZOWNER;" + where, cb);
  });
};

AddressBook.prototype.disconnect = function() {
  this.db.done(function(db) {
    db.close();
  });
};

AddressBook.prototype.fetchContacts = function() {
  return new Promise((resolve, reject) => {
    this.getContacts((error, contacts) => {
      if(error) return reject(error)
      resolve(contacts)
    })
  })
}

module.exports = AddressBook;
