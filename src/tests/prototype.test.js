
function Test(name) {
    this.name = name;
    this.users = []
}

Test.prototype.getUser = function () { return this; }

var test1 = new Test("1212")
var test2 = new Test("12")

console.log(test1.users)
console.log(test2.users)
console.log(test1.users === test2.users)
test2.users.push("修改test2 users")
console.log("test2.users = 修改test2 users")
console.log(test1.users)
console.log(test2.users)