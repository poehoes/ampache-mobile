/*
    Copyright (c) Ampache Mobile
    All rights reserved.

    This file is part of Ampache Mobile.

    Ampache Mobile is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Ampache Mobile is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Ampache Mobile.  If not, see <http://www.gnu.org/licenses/>.
*/


Date.prototype.setISO8601 = function (string) {
    var regexp = "([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})(\.[0-9]+)?(Z|(([-+])([0-9]{2}):([0-9]{2})))";
    var d = string.match(new RegExp(regexp));

    var offset = 0;
    var date = new Date(d[1], 0, 1);

    if (d[2]) { date.setUTCMonth(d[2] - 1); }
    if (d[3]) { date.setUTCDate(d[3]); }
    if (d[4]) { date.setUTCHours(d[4]); }
    if (d[5]) { date.setUTCMinutes(d[5]); }
    if (d[6]) { date.setUTCSeconds(d[6]); }
    //if (d[7]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
    if (d[10] && d[10]!=="Z") { //if Z then its already UTC
        offset = (Number(d[11]) * 60) + Number(d[12]);
        offset *= ((d[10] === '-') ? +1 : -1);
    }

    time = (Number(date) + (offset * 60 * 1000));
    this.setTime(Number(time));
    
 };



Date.prototype.toISO8601String = function (format, offset) {
    /* accepted values for the format [1-6]:
     1 Year:
       YYYY (eg 1997)
     2 Year and month:
       YYYY-MM (eg 1997-07)
     3 Complete date:
       YYYY-MM-DD (eg 1997-07-16)
     4 Complete date plus hours and minutes:
       YYYY-MM-DDThh:mmTZD (eg 1997-07-16T19:20+01:00)
     5 Complete date plus hours, minutes and seconds:
       YYYY-MM-DDThh:mm:ssTZD (eg 1997-07-16T19:20:30+01:00)
     6 Complete date plus hours, minutes, seconds and a decimal
       fraction of a second
       YYYY-MM-DDThh:mm:ss.sTZD (eg 1997-07-16T19:20:30.45+01:00)
    */
    if (!format) { var format = 6; }
    if (!offset) {
        var offset = 'Z';
        var date = this;
    } else {
        var d = offset.match(/([\-+])([0-9]{2}):([0-9]{2})/);
        var offsetnum = (Number(d[2]) * 60) + Number(d[3]);
        offsetnum *= ((d[1] === '-') ? -1 : 1);
        var date = new Date(Number(Number(this) + (offsetnum * 60000)));
    }

    var zeropad = function (num) { return ((num < 10) ? '0' : '') + num; };

    var str = "";
    str += date.getUTCFullYear();
    if (format > 1) { str += "-" + zeropad(date.getUTCMonth() + 1); }
    if (format > 2) { str += "-" + zeropad(date.getUTCDate()); }
    if (format > 3) {
        str += "T" + zeropad(date.getUTCHours()) +
               ":" + zeropad(date.getUTCMinutes());
    }
    if (format > 5) {
        var secs = Number(date.getUTCSeconds() + "." +
                   ((date.getUTCMilliseconds() < 100) ? '0' : '') +
                   zeropad(date.getUTCMilliseconds()));
        str += ":" + zeropad(secs);
    } else if (format > 4) { str += ":" + zeropad(date.getUTCSeconds()); }

    if (format > 3) { str += offset; }
    return str;
};



Date.prototype.addHours = function(value){
    var time = Number(this.getTime()) + (value * 3600 * 1000);
    this.setTime(Number(time));
};

Date.prototype.addDays = function(d) {
        /* Adds the number of days to the date */
        this.setDate( this.getDate() + d );
    };
Date.prototype.addWeeks = function(w) {
        /* Adds the number of weeks to the date */
        this.setDate(this.addDays(w * 7));
    };
Date.prototype.addMonths = function(m) {
        /* Adds the number of months to date
         * If starting with a day that is
         * greater than the number of days
         * in the new month the new date is
         * in the next month
         */
        this.setMonth(this.getMonth() + m);
    };

Date.prototype.addYears = function(y) {
        /* Adds the number of years to date
         * If adding to 2/29 and result is not
         * a leap year the day is set to 28
         */
        var m = this.getMonth();
        this.setFullYear(this.getFullYear() + y);

        //Adjust for leap years
        if (m < this.getMonth()) {
            this.setDate(0);
        }
    };

Date.prototype.clone = function () {
        /* Creates a copy of date by value
         * Normal assignment only creates
         * a reference to the date, whereas
         * this creates a new date object
         */
        return new Date(this.getTime());
    };





