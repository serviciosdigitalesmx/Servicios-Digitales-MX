# Etapa de compilación
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiamos archivos de proyecto para restaurar dependencias
COPY ["apps/backend-api/BackendApi.csproj", "apps/backend-api/"]
COPY ["packages/infrastructure/Infrastructure.csproj", "packages/infrastructure/"]

# Restaurar
RUN dotnet restore "apps/backend-api/BackendApi.csproj"

# Copiamos todo el código y compilamos
COPY . .
WORKDIR "/src/apps/backend-api"
RUN dotnet build "BackendApi.csproj" -c Release -o /app/build

# Publicar
FROM build AS publish
RUN dotnet publish "BackendApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Etapa final (Runtime)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "BackendApi.dll"]
