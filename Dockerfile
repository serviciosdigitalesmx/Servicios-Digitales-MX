FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiamos el archivo de proyecto usando la ruta real desde la raíz
COPY ["apps/backend-api/BackendApi.csproj", "apps/backend-api/"]

# Restauramos dependencias
RUN dotnet restore "apps/backend-api/BackendApi.csproj"

# Copiamos todo el contenido del monorepo
COPY . .

# Compilamos apuntando al proyecto específico
WORKDIR "/src/apps/backend-api"
RUN dotnet build "BackendApi.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "BackendApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "BackendApi.dll"]
