using CookingInspiration.Server.infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddServerServices();

var app = builder.Build();

app.MapControllers();

app.Run();

public partial class Program;
