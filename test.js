const dns = require("dns");

dns.resolveSrv("_mongodb._tcp.madology.o2dlhq4.mongodb.net", (err, records) => {
  console.log(err);
  console.log(records);
});