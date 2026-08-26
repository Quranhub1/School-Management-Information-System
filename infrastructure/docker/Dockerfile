FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENV DOTNET_PRINT_TELEMETRY_MESSAGE=false

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["backend/src/SchoolManagement.Api/SchoolManagement.Api.csproj", "backend/src/SchoolManagement.Api/"]
COPY ["backend/src/SchoolManagement.Application/SchoolManagement.Application.csproj", "backend/src/SchoolManagement.Application/"]
COPY ["backend/src/SchoolManagement.Infrastructure/SchoolManagement.Infrastructure.csproj", "backend/src/SchoolManagement.Infrastructure/"]
COPY ["backend/src/SchoolManagement.Domain/SchoolManagement.Domain.csproj", "backend/src/SchoolManagement.Domain/"]
RUN dotnet restore "backend/src/SchoolManagement.Api/SchoolManagement.Api.csproj"
COPY backend/ .
RUN dotnet build "backend/src/SchoolManagement.Api/SchoolManagement.Api.csproj" -c Release -o /app/build --no-restore

FROM build AS publish
RUN dotnet publish "backend/src/SchoolManagement.Api/SchoolManagement.Api.csproj" -c Release -o /app/publish --no-build

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "schoolmanagement.dll"]
