sap.ui.define([], function () {
    "use strict";
    return {
        formatDateTime: function (vValue) {
            if (!vValue) return "";
            var oDate = (vValue instanceof Date) ? vValue : new Date(vValue);
            if (isNaN(oDate.getTime())) return vValue;

            var dd = ("0" + oDate.getDate()).slice(-2);
            var mm = ("0" + (oDate.getMonth() + 1)).slice(-2);
            var yyyy = oDate.getFullYear();
            var h = oDate.getHours();
            var ampm = h >= 12 ? "PM" : "AM";
            h = h % 12 || 12;
            var hh = ("0" + h).slice(-2);
            var min = ("0" + oDate.getMinutes()).slice(-2);

            return dd + "/" + mm + "/" + yyyy + " " + hh + ":" + min + " " + ampm;
        }
    };
});