FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY BackendApi.csproj ./
RUN dotnet restore

COPY . ./
RUN dotnet publish BackendApi.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://0.0.0.0:10000
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish ./

EXPOSE 10000

ENTRYPOINT ["dotnet", "BackendApi.dll"]
