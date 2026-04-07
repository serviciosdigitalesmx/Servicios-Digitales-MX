FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Ahora solo copiamos el proyecto del backend porque ya es autónomo
COPY ["apps/backend-api/BackendApi.csproj", "apps/backend-api/"]

RUN dotnet restore "apps/backend-api/BackendApi.csproj"

COPY . .
WORKDIR "/src/apps/backend-api"
RUN dotnet build "BackendApi.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "BackendApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "BackendApi.dll"]
