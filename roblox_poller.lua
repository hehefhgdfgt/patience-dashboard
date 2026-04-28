-- Roblox Script Poller for CoachTopia
-- This script polls the server for commands and executes them

local SERVER_URL = "https://coachtopia.fun"
local POLL_INTERVAL = 3 -- seconds

-- HttpGet function
local function httpGet(url)
    local success, result = pcall(function()
        return game:HttpGet(url)
    end)
    if success then
        return result
    else
        warn("[HTTP] GET failed:", result)
        return nil
    end
end

-- HttpPost function
local function httpPost(url, data)
    local success, result = pcall(function()
        return game:HttpPost(url, data or "", false, "application/json")
    end)
    if success then
        return result
    else
        warn("[HTTP] POST failed:", result)
        return nil
    end
end

-- Get IP for debugging
print("[POLLER] Starting Roblox poller...")
print("[POLLER] Server URL:", SERVER_URL)

-- Main polling loop
while true do
    local success, err = pcall(function()
        -- Fetch pending commands
        local response = httpGet(SERVER_URL .. "/api/commands/pending")
        
        if response then
            local decodeSuccess, data = pcall(function()
                return game:GetService("HttpService"):JSONDecode(response)
            end)
            
            if decodeSuccess and data.success and data.commands and #data.commands > 0 then
                for _, cmd in ipairs(data.commands) do
                    print("[EXECUTE] Received command:", cmd.name)
                    
                    if cmd.code then
                        print("[EXECUTE] Executing script...")
                        local execSuccess, execErr = pcall(function()
                            loadstring(cmd.code)()
                        end)
                        
                        if execSuccess then
                            print("[EXECUTE] Script executed successfully")
                        else
                            warn("[EXECUTE] Script failed:", execErr)
                        end
                        
                        -- Mark command as executed (server deletes it automatically, but we call this for completeness)
                        httpPost(SERVER_URL .. "/api/commands/" .. cmd.name .. "/executed", "")
                    end
                end
            end
        end
    end)
    
    if not success then
        warn("[POLLER] Error in poll loop:", err)
    end
    
    wait(POLL_INTERVAL)
end
