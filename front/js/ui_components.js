/* -----------------------------------------------------------------------------
*  NetAlertX
*  Open Source Network Guard / WIFI & LAN intrusion detector 
*
*  ui_components.js - Front module. Common UI components
*-------------------------------------------------------------------------------
#  jokob             jokob@duck.com                GNU GPLv3
----------------------------------------------------------------------------- */



// -------------------------------------------------------------------
// Utility function to generate a random API token in the format t_<random string of specified length>
function generateApiToken(elem, length) {
  // Retrieve and parse custom parameters from the element
  let params = $(elem).attr("my-customparams")?.split(',').map(param => param.trim());
  if (params && params.length >= 1) {
    var targetElementID = params[0];  // Get the target element's ID
  }

  let targetElement = $('#' + targetElementID);

  // Function to generate a random string of a specified length
  function generateRandomString(len) {
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < len; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  // Generate the token in the format t_<random string of length>
  let randomToken = 't_' + generateRandomString(length);

  // Set the generated token as the value of the target element
  if (targetElement.length) {
    targetElement.val(randomToken);
  }
}

// ----------------------------------------------
// Generate a random N-byte hexadecimal key
function getRandomBytes(elem, length) {

  // Retrieve and parse custom parameters from the element
  let params = $(elem).attr("my-customparams")?.split(',').map(param => param.trim());
  if (params && params.length >= 1) {
    var targetElementID = params[0];  // Get the target element's ID
  }

  let targetElement = $('#' + targetElementID);

  // Generate random bytes
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);

  // Convert bytes to hexadecimal string
  let hexString = Array.from(array, byte => 
    byte.toString(16).padStart(2, '0')
  ).join('');

  // Format hexadecimal string with hyphens
  let formattedHex = hexString.match(/.{1,2}/g).join('-');

  console.log(formattedHex);
  // console.log($(`#${targetInput}`).val());

  // Set the formatted key value to the input field
  targetElement.val(formattedHex);
}

// ----------------------------------------------
// Updates the icon preview  
function updateAllIconPreviews() {
  $(".iconInputVal").each((index, el)=>{
    updateIconPreview(el)
  })
}

// ----------------------------------------------
// Updates the icon preview  
function updateIconPreview(elem) {

  const previewSpan =  $(elem).parent().find(".iconPreview");
  const iconInput = $(elem);

  let attempts = 0;

  function tryUpdateIcon() {
    let value = iconInput.val();

    if (value) {
      previewSpan.html(atob(value));
      iconInput.off('change input').on('change input', function () {
        let newValue = $(elem).val();
        previewSpan.html(atob(newValue));
      });
      return; // Stop retrying if successful
    } 

    attempts++;
    if (attempts < 10) {
      setTimeout(tryUpdateIcon, 1000); // Retry after 1 second
    } else {
      console.error("Input value is empty after 10 attempts");
    }
  }

  tryUpdateIcon();
}

// ----------------------------------------------
// Validate the value based on regex
// ⚠ IMPORTANT: use the below to get a valid REGEX ⚠
// const regexStr = String.raw`^(?:\*|(?:[0-9]|[1-5][0-9]|[0-9]+-[0-9]+|\*/[0-9]+))\s+(?:\*|(?:[0-9]|1[0-9]|2[0-3]|[0-9]+-[0-9]+|\*/[0-9]+))\s+(?:\*|(?:[1-9]|[12][0-9]|3[01]|[0-9]+-[0-9]+|\*/[0-9]+))\s+(?:\*|(?:[1-9]|1[0-2]|[0-9]+-[0-9]+|\*/[0-9]+))\s+(?:\*|(?:[0-6]|[0-6]-[0-6]|\*/[0-9]+))$`;
// console.log(btoa(regexStr));
function validateRegex(elem) {
  const iconSpan  = $(elem).parent().find(".validityCheck");
  const inputElem = $(elem);
  const regexTmp  = atob($(inputElem).attr("my-base64Regex")); // Decode base64 regex
  
  const regex = new RegExp(regexTmp); // Convert to a valid RegExp object
  
  let attempts = 0;

  function tryUpdateValidityResultIcon() {
      let value = inputElem.val().trim(); // Ensure trimmed value

      if (value === "") {
          attempts++;
          if (attempts < 10) {
              setTimeout(tryUpdateValidityResultIcon, 1000); // Retry after 1 sec if empty
          } else {
              console.error("Input value is empty after 10 attempts");
          }
          return;
      }

      // Validate against regex
      if (regex.test(value)) {
          iconSpan.html("<i class='fa fa-check'></i>");
      } else {
          iconSpan.html("<i class='fa fa-xmark'></i>");
      }
  }

  // Attach real-time validation on input change
  inputElem.on("input", tryUpdateValidityResultIcon);

  tryUpdateValidityResultIcon(); // Initial validation
}

// -----------------------------------------------------------------------------
// Nice checkboxes with iCheck
function initializeiCheck () {
  // Blue
  $('input[type="checkbox"].blue').iCheck({
    checkboxClass: 'icheckbox_flat-blue',
    radioClass:    'iradio_flat-blue',
    increaseArea:  '20%'
  });

 // Orange
 $('input[type="checkbox"].orange').iCheck({
   checkboxClass: 'icheckbox_flat-orange',
   radioClass:    'iradio_flat-orange',
   increaseArea:  '20%'
 });

 // Red
 $('input[type="checkbox"].red').iCheck({
   checkboxClass: 'icheckbox_flat-red',
   radioClass:    'iradio_flat-red',
   increaseArea:  '20%'
 });

 
}


// -----------------------------------------------------------------------------
// Generic function to copy text to clipboard
function copyToClipboard(buttonElement) {
  const text = $(buttonElement).data('text');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showMessage('Copied to clipboard: ' + text, 1500);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  } else {
    // Fallback to execCommand if Clipboard API is not available
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      showMessage('Copied to clipboard: ' + text, 1500);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
    document.body.removeChild(tempInput);
  }
}

// -----------------------------------------------------------------------------
// Simple Sortable Table columns 
// -----------------------------------------------------------------------------

// Function to handle column sorting when a user clicks on a table header
function sortColumn(element) {
  var th = $(element).closest('th'); // Get the clicked table header
  var table = th.closest('table'); // Find the closest table
  var columnIndex = th.index(); // Get the index of the column
  var ascending = !th.data('asc'); // Toggle sorting order
  sortTable(table, columnIndex, ascending);
  th.data('asc', ascending); // Store sorting order
}

// Function to sort the table based on the selected column
function sortTable(table, columnIndex, ascending) {
  var tbody = table.find('tbody'); // Get the table body
  var rows = tbody.find('tr').toArray().sort(comparer(columnIndex)); // Convert rows to an array and sort
  if (!ascending) {
    rows = rows.reverse(); // Reverse order if descending
  }
  for (var i = 0; i < rows.length; i++) {
    tbody.append(rows[i]); // Append sorted rows back to the table
  }
}

// Function to compare values in the selected column
function comparer(index) {
  return function (a, b) {
    var valA = getCellValue(a, index);
    var valB = getCellValue(b, index);

    // Check if both values are valid IP addresses, and sort numerically if so
    if (isIPAddress(valA) && isIPAddress(valB)) {
      return ipToNum(valA) - ipToNum(valB);
    }

    // If both values are numbers, sort numerically
    if ($.isNumeric(valA) && $.isNumeric(valB)) {
      return valA - valB;
    }

    // Otherwise, sort as text
    return valA.localeCompare(valB);
  };
}

// Function to get the text value from a table cell
function getCellValue(row, index) {
  return $(row).children('td').eq(index).text().trim(); // Get text from the specified column and trim spaces
}

// Function to check if a string is a valid IPv4 address
function isIPAddress(value) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(value); // Regular expression to match IPv4 format
}

// Function to convert an IP address to a numeric value for sorting
function ipToNum(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
}


// ----------------------------------------------------------------------------- 
// handling events 
// ----------------------------------------------------------------------------- 

modalEventStatusId = 'modal-message-front-event'

function execute_settingEvent(element) {

  feEvent     = $(element).attr('data-myevent');
  fePlugin    = $(element).attr('data-myparam-plugin');
  feSetKey    = $(element).attr('data-myparam-setkey');
  feParam     = $(element).attr('data-myparam');
  feSourceId  = $(element).attr('id');
  feValue     = $("#"+feSetKey).val();

  if (["test", "run"].includes(feEvent)) {
    // Calls a backend function to add a front-end event (specified by the attributes 'data-myevent' and 'data-myparam-plugin' on the passed  element) to an execution queue
    // value has to be in format event|param. e.g. run|ARPSCAN
    action = `${getGuid()}|${feEvent}|${fePlugin}`

    $.ajax({
      method: "POST",
      url: "php/server/util.php",
      data: { function: "addToExecutionQueue", action: action  },
      success: function(data, textStatus) {
          // showModalOk ('Result', data );

          // show message
          showModalOk(getString("general_event_title"), `${getString("general_event_description")}  <br/> <br/> <code id='${modalEventStatusId}'></code>`);

          updateModalState()
      }
    })
    
  } else if (["add_option"].includes(feEvent)) {
    showModalFieldInput (
      '<i class="fa fa-square-plus pointer"></i> ' + getString('Gen_Add'),
      getString('Gen_Add'),
      getString('Gen_Cancel'), 
      getString('Gen_Okay'), 
      '', // curValue
      'addOptionFromModalInput',
      feSourceId // triggered by id
    );
  } else if (["add_icon"].includes(feEvent)) {

      // Add new icon as base64 string 
    showModalInput (
      '<i class="fa fa-square-plus pointer"></i> ' + getString('DevDetail_button_AddIcon'),
      getString('DevDetail_button_AddIcon_Help'),
      getString('Gen_Cancel'), 
      getString('Gen_Okay'), 
      () => addIconAsBase64(element), // Wrap in an arrow function
      feSourceId // triggered by id
    );
  } else if (["select_icon"].includes(feEvent)) {

    showIconSelection(feSetKey)
    // myparam-setkey  

  } else if (["copy_icons"].includes(feEvent)) {

    // Ask overwrite icon types 
    showModalWarning (
      getString('DevDetail_button_OverwriteIcons'), 
      getString('DevDetail_button_OverwriteIcons_Warning'),
      getString('Gen_Cancel'), 
      getString('Gen_Okay'), 
      'overwriteIconType',
      feSourceId // triggered by id
    );
  } else if (["go_to_device"].includes(feEvent)) {

    goToDevice(feValue);
  } else if (["go_to_node"].includes(feEvent)) {
    
    goToNetworkNode(feValue);

  } else {
    console.warn(`🔺Not implemented: ${feEvent}`)
  } 
  
}


// -----------------------------------------------------------------------------
// Go to the correct network node in the Network section
function overwriteIconType()
{ 
  const mac = getMac();

  if (!isValidMac(mac)) {
    showModalOK("Error", getString("Gen_InvalidMac")) 
    return;
  }

  // Construct SQL query
  const rawSql = `
   UPDATE Devices 
    SET devIcon = (
      SELECT devIcon FROM Devices WHERE devMac = "${mac}"
    )
    WHERE devType IN (
      SELECT devType FROM Devices WHERE devMac = "${mac}"
    )
  `;

  const apiUrl = `php/server/dbHelper.php?action=write&rawSql=${btoa(encodeURIComponent(rawSql))}`;

  $.get(apiUrl, function(response) {
    if (response === 'OK') {
      showMessage (response);
      updateApi("devices")
    } else {
      showMessage (response, 3000, "modal_red");
    }
  });
}


// -----------------------------------------------------------------------------
// Go to the correct network node in the Network section
function goToNetworkNode(mac)
{ 
  setCache('activeNetworkTab', mac.replaceAll(":","_")+'_id');
  window.location.href = './network.php';
  
}

// -----------------------------------------------------------------------------
// Go to the device 
function goToDevice(mac, newtab = false) {
  const url = './deviceDetails.php?mac=' + encodeURIComponent(mac);
  
  if (newtab) {
    window.open(url, '_blank');
  } else {
    window.location.href = url;
  }
}
  

// --------------------------------------------------------
// Updating the execution queue in in modal pop-up
function updateModalState() {
  setTimeout(function() {
      // Fetch the content from the log file using an AJAX request
      $.ajax({
          url: 'php/server/query_logs.php?file=execution_queue.log',
          type: 'GET',
          success: function(data) {
              // Update the content of the HTML element (e.g., a div with id 'logContent')
              $('#'+modalEventStatusId).html(data);

              updateModalState();
          },
          error: function() {
              // Handle error, such as the file not being found
              $('#logContent').html('Error: Log file not found.');
          }
      });
  }, 2000);
}

// --------------------------------------------------------
// A method to add option to select and make it selected
function addOptionFromModalInput() {
  var inputVal = $(`#modal-field-input-field`).val();
  console.log($('#modal-field-input-field'));
  
  var triggeredBy = $('#modal-field-input').attr("data-myparam-triggered-by");
  var targetId = $('#' + triggeredBy).attr("data-myparam-setkey");

  // Add new option and set it as selected
  $('#' + targetId).append(new Option(inputVal, inputVal)).val(inputVal);
}


// --------------------------------------------------------
// Generate a random MAC address starting 00:1A
function generate_NEWDEV_devMac() {
  const randomHexPair = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
  $('#NEWDEV_devMac').val(`00:1A:${randomHexPair()}:${randomHexPair()}:${randomHexPair()}:${randomHexPair()}`.toLowerCase());
}


// --------------------------------------------------------
// Generate a random IP address starting 192.
function generate_NEWDEV_devLastIP() {
  const randomByte = () => Math.floor(Math.random() * 256);
  $('#NEWDEV_devLastIP').val(`192.${randomByte()}.${randomByte()}.${Math.floor(Math.random() * 254) + 1}`);
}

// -----------------------------------------------------------------------------
// A method to add an Icon as an option to select and make it selected
function addIconAsBase64 (el) {

  var iconHtml = $('#modal-input-textarea').val();

  console.log(iconHtml);

  iconHtmlBase64 = btoa(iconHtml.replace(/"/g, "'"));

  console.log(iconHtmlBase64);


  console.log($('#modal-field-input-field'));
  
  var triggeredBy = $('#modal-input').attr("data-myparam-triggered-by");
  var targetId = $('#' + triggeredBy).attr("data-myparam-setkey");

  // $('#'+targetId).val(iconHtmlBase64); 

  // Add new option and set it as selected
  $('#' + targetId).append(new Option(iconHtmlBase64, iconHtmlBase64)).val(iconHtmlBase64);

  updateIconPreview(el)  

}

// -----------------------------------------------
// modal pop up for icon selection
function showIconSelection(setKey) {

  const selectElement = document.getElementById(setKey);
  const modalId = 'dynamicIconModal';

  // Create modal HTML dynamically
  const modalHTML = `
    <div id="${modalId}" class="modal fade" tabindex="-1" role="dialog">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${getString("Gen_Select")}</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <div id="iconList" class="row"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Append the modal to the body
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const iconList = document.getElementById('iconList');

  // Populate the icon list
  Array.from(selectElement.options).forEach(option => {
    if (option.value != "") {
        
      
      const value = option.value;

      // Decode the base64 value
      let decodedValue;
      try {
        decodedValue = atob(value);
      } catch (e) {
        console.warn(`Skipping invalid base64 value: ${value}`);
        return;
      }

      // Create an icon container
      const iconDiv = document.createElement('div');
      iconDiv.classList.add('iconPreviewSelector','col-md-2' , 'col-sm-3', 'col-xs-4');
      iconDiv.style.cursor = 'pointer';

      // Render the SVG or HTML content
      const iconContainer = document.createElement('div');
      iconContainer.innerHTML = decodedValue;

      // Append the icon to the div
      iconDiv.appendChild(iconContainer);
      iconList.appendChild(iconDiv);

      // Add click event to select icon
      iconDiv.addEventListener('click', () => {
        selectElement.value = value; // Update the select element value
        $(`#${modalId}`).modal('hide'); // Hide the modal
        updateAllIconPreviews();
      });
    }
  });

  // Show the modal using AJAX
  $(`#${modalId}`).modal('show');

  // Remove modal from DOM after it's hidden
  $(`#${modalId}`).on('hidden.bs.modal', function () {
    document.getElementById(modalId).remove();
  });

  //
  
}


// -----------------------------------------------------------------------------
// Get the correct db column code name based on table header title string
function getColumnNameFromLangString(headStringKey) {
  columnNameMap = {
    "Device_TableHead_Name": "devName",
    "Device_TableHead_Owner": "devOwner",
    "Device_TableHead_Type": "devType",
    "Device_TableHead_Icon": "devIcon",
    "Device_TableHead_Favorite": "devFavorite",
    "Device_TableHead_Group": "devGroup",
    "Device_TableHead_FirstSession": "devFirstConnection",
    "Device_TableHead_LastSession": "devLastConnection",
    "Device_TableHead_LastIP": "devLastIP",
    "Device_TableHead_MAC": "devMac",
    "Device_TableHead_Status": "devStatus",
    "Device_TableHead_MAC_full": "devMac",
    "Device_TableHead_LastIPOrder": "devIpLong",
    "Device_TableHead_Rowid": "rowid",
    "Device_TableHead_Parent_MAC": "devParentMAC",
    "Device_TableHead_Connected_Devices": "devParentChildrenCount",
    "Device_TableHead_Location": "devLocation",
    "Device_TableHead_Vendor": "devVendor",
    "Device_TableHead_Port": "devParentPort",
    "Device_TableHead_GUID": "devGUID",
    "Device_TableHead_SyncHubNodeName": "devSyncHubNode",
    "Device_TableHead_NetworkSite": "devSite",
    "Device_TableHead_SSID": "devSSID",
    "Device_TableHead_SourcePlugin": "devSourcePlugin",
    "Device_TableHead_PresentLastScan": "devPresentLastScan",
    "Device_TableHead_AlertDown": "devAlertDown",
    "Device_TableHead_CustomProps": "devCustomProps",
    "Device_TableHead_FQDN": "devFQDN",
    "Device_TableHead_ParentRelType": "devParentRelType",
    "Device_TableHead_ReqNicsOnline": "devReqNicsOnline"
  };

  return columnNameMap[headStringKey] || "";
}

//--------------------------------------------------------------
// Generating the device status chip
function getStatusBadgeParts(devPresentLastScan, devAlertDown, devMac, statusText = '') {
  let css = 'bg-gray text-white statusUnknown';
  let icon = '<i class="fa-solid fa-question"></i>';
  let status = 'unknown';
  let cssText = '';

  if (devPresentLastScan == 1) {
    css = 'bg-green text-white statusOnline';
    cssText = 'text-green';
    icon = '<i class="fa-solid fa-plug"></i>';
    status = 'online';
  } else if (devAlertDown == 1) {
    css = 'bg-red text-white statusDown';
    cssText = 'text-red';
    icon = '<i class="fa-solid fa-triangle-exclamation"></i>';
    status = 'down';
  } else if (devPresentLastScan != 1) {
    css = 'bg-gray text-white statusOffline';
    cssText = 'text-gray50';
    icon = '<i class="fa-solid fa-xmark"></i>';
    status = 'offline';
  }

  const cleanedText = statusText.replace(/-/g, '');
  const url = `deviceDetails.php?mac=${encodeURIComponent(devMac)}`;

  return {
    cssClass: css,
    cssText: cssText,
    iconHtml: icon,
    mac: devMac,
    text: cleanedText,
    status: status,
    url: url
  };
}

//--------------------------------------------------------------
// Getting the color and css class for device relationships
function getRelationshipConf(relType) {
  let cssClass = '';
  let color = '';

  // --color-aqua: #00c0ef;
  // --color-blue: #0060df;
  // --color-green: #00a65a;
  // --color-yellow: #f39c12;
  // --color-red: #dd4b39;

  switch (relType) {
        
    case "child":
      color = "#f39c12"; // yellow
      cssClass = "text-yellow";
      break;
    case "nic":
      color = "#dd4b39"; // red
      cssClass = "text-red";
      break;
    case "virtual":
      color = "#0060df"; // blue
      cssClass = "text-blue";
      break;      
    case "logical":
      color = "#00a65a"; // green
      cssClass = "text-green";
      break;      
    default:
      color = "#5B5B66"; // grey
      cssClass = "text-light-grey";
      break;
  }

  return {
    cssClass: cssClass,
    color: color
  };
}


// -----------------------------------------------------------------------------
// initialize
// -----------------------------------------------------------------------------

function initSelect2() {

  // Retrieve device list from session variable
  var devicesListAll_JSON = getCache('devicesListAll_JSON');

  //  check if cache ready
  if(isValidJSON(devicesListAll_JSON))
  {
    
    // --------------------------------------------------------
    //Initialize Select2 Elements and make them sortable
    
    $(function () {
      // Iterate over each Select2 dropdown
      $('.select2').each(function() {          
          // handle Device chips, if my-transformers="deviceChip"
          if($(this).attr("my-transformers") == "deviceChip")
          {
            var selectEl = $(this).select2({
              templateSelection: function (data, container) {
                return $(renderDeviceLink(data, container));
              },
              escapeMarkup: function (m) {
                return m; // Allow HTML
              }
            });
            
          } else if($(this).attr("my-transformers") == "deviceRelType") // handling dropdown for relationships
          {
            var selectEl = $(this).select2({
              minimumResultsForSearch: Infinity,
              templateSelection: function (data, container) {
                if (!data.id) return data.text; // default for placeholder etc.

                const relConf = getRelationshipConf(data.text);
                                
                // Custom HTML
                const html = $(`                  
                    <span class="custom-chip ${relConf.cssClass}" >                      
                      ${data.text}                      
                    </span>                  
                `);
          
                return html;
              },
              escapeMarkup: function (m) {
                return m; // Allow HTML
              }
            });
            
          } else // default handling - default template
          {
            var selectEl = $(this).select2();
          }
    
          // Apply sortable functionality to the dropdown's dropdown-container
          selectEl.next().children().children().children().sortable({
              containment: 'parent',
              update: function () {
                  var sortedValues = $(this).children().map(function() {
                      return $(this).attr('title');
                  }).get();
    
                  var sortedOptions = selectEl.find('option').sort(function(a, b) {
                      return sortedValues.indexOf($(a).text()) - sortedValues.indexOf($(b).text());
                  });
    
                  // Replace all options in selectEl
                  selectEl.empty().append(sortedOptions);
    
                  // Trigger change event on Select2
                  selectEl.trigger('change');
              }
          });
      });
    });
  } else // cache not ready try later
  {
    setTimeout(() => {
      initSelect2()
    }, 1000);
  }  
}

// ------------------------------------------
// Render a device link with hover-over functionality
function renderDeviceLink(data, container, useName = false) {
  // If no valid MAC, return placeholder text
  if (!data.id || !isValidMac(data.id)) {
    return `<span>${data.text}<span/>`;
  }

  const device = getDevDataByMac(data.id);
  if (!device) {
    return data.text;
  }

  // Build and return badge parts
  const badge = getStatusBadgeParts(
    device.devPresentLastScan,
    device.devAlertDown,
    device.devMac
  );

  // badge class and hover-info class to container
  $(container)
    .addClass(`${badge.cssClass} hover-node-info`)
    .attr({
      'data-name': device.devName,
      'data-ip': device.devLastIP,
      'data-mac': device.devMac,
      'data-vendor': device.devVendor,
      'data-type': device.devType,
      'data-lastseen': device.devLastConnection,
      'data-firstseen': device.devFirstConnection,
      'data-relationship': device.devParentRelType,
      'data-status': device.devStatus,
      'data-present': device.devPresentLastScan,
      'data-alert': device.devAlertDown,
      'data-icon': device.devIcon
    });
  
  return `
    <a href="${badge.url}" target="_blank">
      <span class="custom-chip">
        <span class="iconPreview">${atob(device.devIcon)}</span>
        ${useName ? device.devName : data.text}
        <span>
          (${badge.iconHtml})
        </span>
      </span>
    </a>
  `;
}

// ------------------------------------------
// Display device info on hover (attach only once)
function initHoverNodeInfo() {
  if ($('#hover-box').length === 0) {
    $('<div id="hover-box"></div>').appendTo('body').hide().css({
      position: 'absolute',
      zIndex: 9999,
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '10px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      minWidth: '200px',
      maxWidth: '300px',
      fontSize: '14px',
      pointerEvents: 'none',
      backgroundColor: '#fff'
    });
  }

  // check if handlers already attached to prevent flickering
  if (initHoverNodeInfo._handlersAttached) return;
  initHoverNodeInfo._handlersAttached = true;

  let hoverTimeout = null;
  let lastTarget = null;

  // remove title as it's replaced by the hover-box
  $(document).on('mouseover', '.hover-node-info', function () {
    this.removeAttribute('title');

    $(this).attr("title", ""); // remove title as it's replaced by the hover-box
  });

  $(document).on('mouseenter', '.hover-node-info', function (e) {
    const $el = $(this);
    lastTarget = this;
    
    // use timeout to prevent a quick hover and exit toi flash a card when navigating to a target node with your mouse
    clearTimeout(hoverTimeout);

    hoverTimeout = setTimeout(() => {
      if (lastTarget !== this) return;

      const icon = $el.data('icon');
      const name = $el.data('name') || 'Unknown';
      const ip = $el.data('ip') || 'N/A';
      const mac = $el.data('mac') || 'N/A';
      const vendor = $el.data('vendor') || 'Unknown';
      const type = $el.data('type') || 'Unknown';
      const lastseen = $el.data('lastseen') || 'Unknown';
      const firstseen = $el.data('firstseen') || 'Unknown';
      const relationship = $el.data('relationship') || 'Unknown';
      const badge = getStatusBadgeParts( $el.data('present'),  $el.data('alert'), $el.data('mac'))
      const status =`<span class="badge ${badge.cssClass}">${badge.iconHtml} ${badge.status}</span>`

      const html = `
        <div>
          <b> <div class="iconPreview">${atob(icon)}</div> </b><b class="devName"> ${name}</b><br>
        </div>
        <hr/>
        <div class="line">
          <b>Status:</b> <span>${status}</span><br>
        </div>
        <div class="line">  
          <b>IP:</b> <span>${ip}</span><br>
        </div>
        <div class="line">  
          <b>MAC:</b> <span>${mac}</span><br>
        </div>
        <div class="line">  
          <b>Vendor:</b> <span>${vendor}</span><br>
        </div>
        <div class="line">  
          <b>Type:</b> <span>${type}</span><br>
        </div>
        <div class="line">  
          <b>First seen:</b> <span>${firstseen}</span><br>
        </div>
        <div class="line">  
          <b>Last seen:</b> <span>${lastseen}</span><br>
        </div>
        <div class="line">  
          <b>Relationship:</b> <span class="${getRelationshipConf(relationship).cssClass}">${relationship}</span>
        </div>
      `;

      $('#hover-box').html(html).fadeIn(150);
    }, 300);
  });

  $(document).on('mousemove', '.hover-node-info', function (e) {
    const hoverBox = $('#hover-box');
    const boxWidth = hoverBox.outerWidth();
    const boxHeight = hoverBox.outerHeight();
    const padding = 15;

    const winWidth = $(window).width();
    const winHeight = $(window).height();

    let left = e.pageX + padding;
    let top = e.pageY + padding;

    // Position leftward if close to right edge
    if (e.pageX + boxWidth + padding > winWidth) {
      left = e.pageX - boxWidth - padding;
    }

    // Position upward if close to bottom edge
    if (e.pageY + boxHeight + padding > winHeight) {
      top = e.pageY - boxHeight - padding;
    }

    hoverBox.css({ top: top + 'px', left: left + 'px' });
  });

  $(document).on('mouseleave', '.hover-node-info', function () {
    clearTimeout(hoverTimeout);
    lastTarget = null;
    $('#hover-box').fadeOut(100);
  });
}

/**
 * Generates a DataTables-style `lengthMenu` array with an optional custom entry inserted
 * in the correct numeric order.
 *
 * Example output:
 *   [[10, 20, 25, 50, 100, 500, 100000], [10, 20, 25, 50, 100, 500, 'All']]
 *
 * @param {number} newEntry - A numeric entry to insert into the list (e.g. 30).
 *                            If it already exists or equals -1, it will be ignored.
 * @returns {Array[]} A two-dimensional array where:
 *                    - The first array is the numeric page lengths.
 *                    - The second array is the display labels (same values, but 'All' for -1).
 *
 * @example
 * getLengthMenu(30);
 * // → [[10, 20, 25, 30, 50, 100, 500, 100000], [10, 20, 25, 30, 50, 100, 500, 'All']]
 */
function getLengthMenu(newEntry) {
  const values = [10, 20, 25, 50, 100, 500, 100000];
  const labels = [10, 20, 25, 50, 100, 500, getString('Device_Tablelenght_all')];

  // Insert newEntry in sorted order, skipping duplicates and -1/'All'
  const insertSorted = (arr, val) => {
    if (val === -1 || arr.includes(val)) return arr;
    const idx = arr.findIndex(v => v > val || v === -1);
    if (idx === -1) arr.push(val);
    else arr.splice(idx, 0, val);
    return arr;
  };

  insertSorted(values, newEntry);
  insertSorted(labels, newEntry);

  return [values, labels];
}


console.log("init ui_components.js")