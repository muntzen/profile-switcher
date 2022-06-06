const applescript = require('applescript')
const {ipcRenderer} = require('electron');

const selectProfile = (event) => {
    const profileName = event.target.innerText;
    const activateScript = `
        tell application "System Events"
            tell its application process "Chrome"
                set frontmost to true
                click menu item "${profileName}" of menu "Profiles" of menu bar 1
            end tell
        end tell    
    `;
    
    // see if there's an argument passed in that's a URL, i could certainly do better than 
    // "starts with http", but, meh, it'll work for my purposes for now
    const val = require('@electron/remote').getGlobal('sharedObject').prop1;
    const arguments = val.toString().split(',');
    let url = undefined;
    for (const arg of arguments) {
        if (arg.startsWith('http')) {
            url = arg;
            break;
        }
    }

    if (url) {
        applescript.execString(activateScript, () => {
            const openLinkScript = `
                tell application "Chrome" to open location "${url}"
            `;
            applescript.execString(openLinkScript, () => {
                ipcRenderer.send('close-app');
            });
        });    
    } else {
        ipcRenderer.send('close-app');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const getProfilesScript =  `
        tell application "System Events"
            tell its application process "Chrome"
                set profiles to name of menu items of menu "Profiles" of menu bar 1
            end tell
        end tell
        return profiles
    `;
    
    applescript.execString(getProfilesScript, (err, returnValue) => {
        if (err) {
            console.log('poopy: ' + err);
        } else {
            const menuItems = returnValue.toString().split(",");
            
            /*
             this is sorta hacky, i'm reading the menu items and need to remove
             the cruft, so i'll assume chrome always works the same
             way and the last four elements are:
                missing value, Edit…, missing value, Add Profile…
             where "missing value" is the line separator, so i'll just remove
             the last four items. alternatively, if this causes issues, 
             i guess i could scroll and remove the known non-profiles :shrug:
            */
            const profiles = menuItems.slice(0, menuItems.length - 4);

            // add each profile
            const profilesElem = document.getElementById('profiles');
            profilesElem.removeChild(profilesElem.children[0]);
            for (const profile of profiles) {
                const profileItem = document.createElement('button');
                profileItem.innerText = profile;
                profilesElem.appendChild(profileItem);
                profileItem.onclick = selectProfile;
            }
        }
    })

})