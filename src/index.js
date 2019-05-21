import "./style/site";
import "./style/maillist";


import MailList from "./maillist";
import Picker from "./plugins/picker";

// const mailList = new MailList({ el: "#app", url: "http://meunsc.oicp.net:47941/api/v2/organization_tree?userId=CA1E29D0-F795-E811-810B-E4D8E29B238C" });
// mailList.loadData(data);
const pciker = new Picker({ className: "picker-fullscreen" });
// document.getElementById('invokeMailList').onclick = function () {
//     mailList.open();
// }

document.getElementById('picker').onclick = function () {
    pciker.open();
}
