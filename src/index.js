import "./style/site";
import "./style/maillist";


import MailList from "./plugins/maillist";
import Picker from "./plugins/picker";

// const mailList = new MailList({ el: "#app", url: "http://meunsc.oicp.net:47941/api/v2/organization_tree?userId=68D5333D-F106-4A45-9A5B-61589DA05FFD" });
// mailList.loadData(data);
const pciker = new Picker({ className: "picker-fullscreen" });
// document.getElementById('invokeMailList').onclick = function () {
//     mailList.open();
// }

document.getElementById('picker').onclick = function () {
    pciker.open();
}
