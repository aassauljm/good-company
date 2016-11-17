"use strict";
import moment from 'moment';
import { saveAs } from 'file-saver';


function createICS(data) {
    const {title, description, location, url, reminder} = data;
    const dtstamp = moment().utc().format('YYYYMMDDTHHmmss') + 'Z';
    let dtstart;
    if(data.hour){
        dtstart = moment(data.date).hour(data.hour).utc().format('YYYYMMDDTHHmmss') + 'Z';
    }
    else{
        dtstart = moment(data.date).utc().format('YYYYMMDDTHHmmss') + 'Z';
    }

    const alarm = () => {
        if(reminder){
            return `BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:REMINDER
TRIGGER;RELATED=START:${reminder}
END:VALARM`;
        }
        return '';
    }

    const result = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Good Companies//gc.catalex.nz//Catalex Ltd
METHOD:PUBLISH
BEGIN:VEVENT
DTSTAMP:${dtstamp}
DTSTART;TZID="Auckland, Wellington":${dtstart}
DTEND;TZID="Auckland, Wellington":${dtstart}
SUMMARY:${title}
DESCRIPTION:${description || ''}
LOCATION:${location || ''}
URL:${url || ''}
ORGANIZER:MAILTO:mail@catalex.nz
${alarm()}
TRANSP:TRANSPARENT
END:VEVENT
END:VCALENDAR`
    return result;
}

export default function exportICS(data) {
    const text = createICS(data)
    const file = new Blob([text], {type: 'text/plain'});
    return saveAs(file, `${data.title}.ics`);
}

