SELECT 
    "Id", 
    "InstitutionName", 
    "IsActive", 
    CASE WHEN "LogoData" IS NULL THEN 'NULL' ELSE length("LogoData")::text || ' bytes' END AS "LogoData", 
    "LogoContentType" 
FROM public."InstitutionSettings" 
WHERE "IsActive" = TRUE;
