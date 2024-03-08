// ==UserScript==
// @name Raubzug schicken
// @version 1.2
// @description Rechnet/Fügt die Truppen für die jeweiligen Raubzugstufen aus/ein
// @author TheHebel97, Osse
// @match https://*.die-staemme.de/game.php?*&screen=place&mode=scavenge*
// ==/UserScript==

var api = typeof unsafeWindow != 'undefined' ? unsafeWindow.ScriptAPI : window.ScriptAPI;

api.register('470-Raubzug schicken', true, 'osse, TheHebel97', 'support-nur-im-forum@die-staemme.de');

(function () {
    'use strict';

    setTimeout(function () {
        setupUI();

        let storage = localStorage;
        getLocalStorage();

        $(".saveLocalStorage").on("click", function () {
            setLocalStorage();
        });

        $(".clearLocalStorage").on("click", function () {
            storage.removeItem("scavenger");
        });

        let Start = 0;
        let rzSlots;
        let Truppenarray = [];

        $(".SendScavenger").on("click", function () {
            Start = 1;
            rzSlots = readOutRZSlotsCB();
            let arrayUseableTroops = getTroopAmount();
            let SendTroops = [];

            for (let index = 0; index < 4; index++) {
                const element = rzSlots.charAt(index)
            }

            arrayUseableTroops.forEach(element => {
                SendTroops[element["unit"]] = getTroopsPerRzSlot(element["amount"], rzSlots, "proportional");
            });

            Truppenarray = SendTroops;
            startScavenger();
        });

        $(".free_send_button").on("click", function () {
            if (Start === 1) {
                $(".SendScavenger").css('visibility', "hidden");
                startScavenger();
            }
        });

        if ($('.premium_send_button').length > 0) {
            $(".premium_send_button").on("click", function () {
                setTimeout(() => {
                    sendPremium();
                }, 200);
            });
        };

        function sendPremium() {
            $(".evt-confirm-btn").on("click", function () {
                if (Start === 1) {
                    $(".SendScavenger").css('visibility', "hidden");
                    startScavenger();
                }
            });
        }

        String.prototype.replaceAt = function (index, replacement) {
            return this.substr(0, index) + replacement + this.substr(index + replacement.length);
        }

        function startScavenger() {
            setTimeout(function () {
                let Scaveng = 0;

                for (let index = 3; index > -1; index--) {
                    const element = rzSlots.charAt(index)

                    if (element === "1" && Scaveng === 0) {
                        Scaveng = 1;

                        if ($('.scavenge-option').eq(index).find('.premium_send_button').length > 0) {
                            $('.scavenge-option').eq(index).find('.premium_send_button').css('visibility', "visible");
                        }

                        if ($('.scavenge-option').eq(index).find('.free_send_button').length > 0) {
                            $('.scavenge-option').eq(index).find('.free_send_button').css('visibility', "visible");
                        }

                        getTroopAmount().forEach(element => {
                            let eInput = document.querySelector("#scavenge_screen > div > div.candidate-squad-container > table > tbody > tr:nth-child(2) > td:nth-child(" + element["value"] + ") > input")
                            eInput.value = Truppenarray[element["unit"]][index];
                            let event = new Event('change');
                            eInput.dispatchEvent(event);
                        });

                        rzSlots = rzSlots.replaceAt(index, "0");
                    } else {
                        if ($('.scavenge-option').eq(index).find('.premium_send_button').length > 0) {
                            $('.scavenge-option').eq(index).find('.premium_send_button').css('visibility', "hidden");
                        }

                        if ($('.scavenge-option').eq(index).find('.free_send_button').length > 0) {
                            $('.scavenge-option').eq(index).find('.free_send_button').css('visibility', "hidden");
                        }
                    }
                }
            }, 200)
        }

        function getNumberOfUnlockedScavengeSlots() {
            return 4 - $(".lock").length;
        }

        function getTroopAmount() {
            let troopObject = [];
            let value = 0;

            game_data.units.forEach(element => {
                if (element != "ram" && element != "catapult" && element != "spy") {
                    value += 1;
                }

                if ($("input[unit='" + element + "']").is(":checked")) {
                    $(".unitsInput").each(function () {
                        if (this.name === element) {
                            let amount = $(".units-entry-all[data-unit='" + element + "']").text().match(/\d+/)[0];
                            if (parseInt($('.maxTroops').val()) < amount) {
                                amount = parseInt($('.maxTroops').val());
                            }

                            let temparray = {
                                unit: element,
                                amount: amount,
                                value: value
                            }

                            if (parseInt(amount) > 0) troopObject.push(temparray)
                        }
                    })
                }
            });

            return troopObject
        }

        function getTroopsPerRzSlot(amount, level, calcType) {
            let weights;

            switch (calcType) {
                case "equalyLong":
                    weights = [7.5, 3, 1.5, 1];
                    break;
                case "proportional":
                    weights = [10, 5, 3, 2]; // Beispielgewichtungen für proportionale Verteilung
                    break;
                default:
                    weights = [7.5, 3, 1.5, 1];
            }

            let amounts = [];
            let sum = weights.reduce((a, b) => a + b, 0);

            for (let i = 0; i < weights.length; i++) {
                if (level.charAt(i) == "1") {
                    let troops = Math.floor(amount * weights[i] / sum);
                    amounts.push(troops);
                } else {
                    amounts.push(0);
                }
            }

            return amounts;
        }

        function setupUI() {
            $(".border-frame-gold-red").css("padding-bottom", "10px");
            $(".candidate-squad-widget > tbody > tr").eq(0).append("<th>Senden</th>");
            $(".candidate-squad-widget > tbody > tr").eq(1).append('<td><button class="SendScavenger btn">Raubzug senden</button></td>');

            let Options = `<label>max. Truppen</label><input class="maxTroops" type="number" min="10" max="10000" checked><button class="clearLocalStorage btn">Default löschen</button><button class="saveLocalStorage btn">Default speichern</button>`;
            $(".candidate-squad-widget").before(Options);

            for (let index = 0; index < getNumberOfUnlockedScavengeSlots(); index++) {
                $(".preview").eq(index).before('<input class="checkbox_' + index + '" type="checkbox" checked style="margin-left: 50%;margin-top: 10px;" unit="' + index + '">');
                if ($(".preview").eq(index).find(".return-countdown").length) {
                    $(".checkbox_" + index).prop('disabled', true);
                    $(".checkbox_" + index).removeAttr("checked");
                }
            }

            $(".unit_link").each(function () {
                let unit = $(this).attr("data-unit")
                $(this).parent().append('<input class="checkboxTroops" type="checkbox" checked="" style="width:20%;" unit="' + unit + '"></input>')
            })
        }

        function readOutRZSlotsCB() {
            let level = "";

            for (let index = 0; index < getNumberOfUnlockedScavengeSlots(); index++) {
                if ($('.checkbox_' + index).is(":checked")) {
                    level += "1";
                } else {
                    level += "0";
                }
            }

            if (level.length < 4) {
                for (let index = level.length; index < 4; index++) {
                    level += "0";
                }
            }

            return level;
        }

        function getLocalStorage() {
            let data = storage.getItem("scavenger")
            if (data != null) {
                data = JSON.parse(data);
                data.forEach(element => {
                    $("input[unit='" + element.unit + "']").prop('checked', element.checked);
                });
            }

            let maxValue = storage.getItem("maxScavenger")
            if (data != null) {
                $(".maxTroops").val(maxValue);
            }

            let selectedScavenger = storage.getItem("SelectionScavenger")
            if(selectedScavenger != null){
                selectedScavenger = JSON.parse(selectedScavenger);
                for (let index = 0; index < 4; index++) {
                    if(selectedScavenger[index] == 1 && $(".checkbox_" + index).attr('disabled') == undefined){
                        $(".checkbox_" + index).prop( "checked", true );
                    }else{
                        $(".checkbox_" + index).prop( "checked", false );
                    }
                }
            }
        }

        function setLocalStorage() {
            let tempArray = [];
            $(".checkboxTroops").each(function () {
                let tempObject = {
                    unit: $(this).attr("unit"),
                    checked: $(this).is(":checked")
                }
                tempArray.push(tempObject)
            })

            storage.setItem("scavenger", JSON.stringify(tempArray))

            let maxValue = $(".maxTroops").val();
            storage.setItem("maxScavenger", maxValue)

            tempArray = [];
            for (let index = 0; index <= 4; index++) {
                if($(".checkbox_" + index).is(':checked')) {
                    tempArray.push(1);
                }else{
                    tempArray.push(0);
                }
            }
            storage.setItem("SelectionScavenger", JSON.stringify(tempArray))
        }
    }, 50)
})();
