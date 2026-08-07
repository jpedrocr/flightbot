#!/usr/bin/osascript

on run
    -- 1?? Obter e limpar o HTML da nota
    set htmlBody to getHtmlFromNotes("Viagens 2025")
    set plainText to htmlToPlain(htmlBody)
    
    -- 2?? Extrair linhas pendentes
    set pendingLines to extractPendingLines(plainText)
    
    -- 3?? Converter para array de dicionários AppleScript
    set flights to buildFlightsList(pendingLines)

    -- Mostrar resultados
    set flightsText to ""
    repeat with flight in flights
        set origemStr to origem of flight
        set destinoStr to destino of flight
        set dataGrandeStr to dataGrande of flight
        set flightsText to flightsText & origemStr & " : " & destinoStr & " : " & dataGrandeStr & return
    end repeat
    display dialog flightsText with title "Voo(s) pendente(s)" buttons {"OK"} default button 1
    
    -- 4?? Abrir cada voo no Safari
    set countTabs to openFlightsInSafari(flights)
    --set countTabs to 0
    
    return "Abriu " & countTabs & " separadores no Safari."
end run


-- Handler: Lê o body HTML da nota indicada
on getHtmlFromNotes(noteName)
    tell application "Notes"
        set theNote to first note whose name is noteName
        return the body of theNote as text
    end tell
end getHtmlFromNotes

-- Handler: Remove riscado e converte HTML para texto puro UTF-8
on htmlToPlain(html)
    set step1 to do shell script "printf %s " & quoted form of html & " | sed '/<strike>/d'"
    return do shell script "printf %s " & quoted form of step1 & " | " & ¬
        "textutil -stdin -stdout -format html -convert txt -inputencoding utf-8"
end htmlToPlain

-- Handler: Devolve só as linhas com “para” e sem “: OK”
on extractPendingLines(textBody)
    set pendingLines to {}
    repeat with ln in paragraphs of textBody
        set lnStr to ln as string
        if lnStr contains "para" and lnStr does not contain ": OK" then
            copy lnStr to end of pendingLines
        end if
    end repeat
    return pendingLines
end extractPendingLines

-- Handler: A partir de cada linha “OPO para OSL : YYYY-MM-DD :”, devolve lista de records
on buildFlightsList(linesList)
    set flights to {}
    repeat with ln in linesList
        -- separar partes
        set AppleScript's text item delimiters to " : "
        set parts to text items of ln
        set odPart to item 1 of parts
        set dateRaw to item 2 of parts
        set dateStr to shortDate(dateRaw)
        
        set AppleScript's text item delimiters to " para "
        set odItems to text items of odPart
        set origem to item 1 of odItems
        set destino to item 2 of odItems
        
        copy {origem:origem, destino:destino, dataGrande:dateRaw, dataPequena:dateStr} to end of flights
    end repeat
    return flights
end buildFlightsList

-- Handler: Abre vários separadores numa só janela do Safari e clica em "Cheapest"
on openFlightsInSafari(flights)
    tell application "Safari"
        activate
        
        -- 1?? Abre uma janela
        make new document
        
        -- 2?? Usa sempre a janela da frente
        set targetWindow to front window
        set countTabs to 0
        
        -- 3?? Para cada voo, adiciona um separador nessa janela
        repeat with flight in flights
            set origemStr  to flight's origem
            set destinoStr to flight's destino
            set dataPequenaStr to flight's dataPequena
            set dataGrandeStr to flight's dataGrande
            
            set urlFlight to "https://www.skyscanner.pt/transport/flights/" & origemStr & "/" & destinoStr & "/" & dataPequenaStr & "/?adultsv2=1&cabinclass=economy&adultsv2=1&childrenv2=&duration=720&inboundaltsenabled=false&outboundaltsenabled=false&ref=home&rtn=0&stops=!twoPlusStops"
            
            tell targetWindow
                set newTab to make new tab with properties {URL:urlFlight}
            end tell
            
            -- Increment the tab count
            set countTabs to countTabs + 1

            -- Espera a página carregar
            delay 2

            -- Seleciona o separador correto
            set current tab of targetWindow to newTab

            -- Usa JavaScript para clicar no botão "Cheapest"
            do JavaScript "var el = document.evaluate('//*[@id=\"1\"]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; if(el) el.click();" in newTab

            delay 8

            -- Para cada elemento do document.querySelectorAll('.FlightsTicket_container__MzRiO');
            -- Obter o hiperlink 'a.BookingPanelLink_link__YTY4M' e o texto 'div.UpperTicketBody_visuallyHidden__OTBhM'
            -- Guardar tudo no ficheiro Json
            set filePath to "/Users/jpedrocr/Code/FlightBot/Voos/" & dataGrandeStr & "-" & origemStr & "-" & destinoStr & ".json"

            set content to do JavaScript "var elements = document.querySelectorAll('.FlightsTicket_container__MzRiO');var data=[];elements.forEach(function(el){var link=el.querySelector('.BookingPanelLink_link__YTY4M').href;var text=el.querySelector('div.UpperTicketBody_visuallyHidden__OTBhM').innerText.replace(/\\n/g, ' ');data.push({link:link,text:text});});JSON.stringify(data);" in newTab

            -- A estrutura do ficheiro Json é:
            -- {
            --   "viagem": {
            --     "data": "{{dataGrande}}",
            --     "origem": "{{origem}}",
            --     "destino": "{{destino}}",
            --     "voos": [
            --       {
            --         "link": "{{link}}",
            --         "text": "{{text}}"
            --       }
            --     ]
            --   }
            -- }
            -- a data é convertida do formato YYMMDD para o formato YYYY-MM-DD

            set jsonContent to "{\"viagem\": {\"data\": \"" & dataGrandeStr & "\", \"origem\": \"" & origemStr & "\", \"destino\": \"" & destinoStr & "\", \"voos\": " & content & "}}"
            set fileContent to do shell script "echo " & quoted form of jsonContent & " > " & quoted form of filePath
            
            -- Adiciona um pequeno atraso para evitar sobrecarga no Safari
            delay 1

            -- Fecha o separador
            close newTab
        end repeat
    end tell
    
    return countTabs
end openFlightsInSafari

-- Handler: Formata data YYYY-MM-DD para YYMMDD
on shortDate(dateRaw)
    -- 1?? Separa por hífen
    set AppleScript's text item delimiters to "-"
    set dateParts to text items of dateRaw
    set yearPart  to item 1 of dateParts
    set monthPart to item 2 of dateParts
    set dayPart   to item 3 of dateParts

    -- 2?? Extrai só os dois últimos dígitos do ano
    set yy to text -2 thru -1 of yearPart

    -- 3?? Repõe os delimitadores para evitar efeitos colaterais
    set AppleScript's text item delimiters to ""

    -- 4?? Junta em “AAMMDD”
    return yy & monthPart & dayPart
end shortDate
