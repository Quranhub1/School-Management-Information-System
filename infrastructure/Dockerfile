# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["backend/SchoolManagement.sln", "backend/"]
COPY ["backend/src/SchoolManagement.Api/SchoolManagement.Api.csproj", "backend/src/SchoolManagement.Api/"]
COPY ["backend/src/SchoolManagement.Application/SchoolManagement.Application.csproj", "backend/src/SchoolManagement.Application/"]
COPY ["backend/src/SchoolManagement.Domain/SchoolManagement.Domain.csproj", "backend/src/SchoolManagement.Domain/"]
COPY ["backend/src/SchoolManagement.Infrastructure/SchoolManagement.Infrastructure.csproj", "backend/src/SchoolManagement.Infrastructure/"]
RUN dotnet restore "backend/src/SchoolManagement.Api/SchoolManagement.Api.csproj"

COPY backend/ .
RUN dotnet build "backend/src/SchoolManagement.Api/SchoolManagement.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "backend/src/SchoolManagement.Api/SchoolManagement.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "SchoolManagement.Api.dll"]
