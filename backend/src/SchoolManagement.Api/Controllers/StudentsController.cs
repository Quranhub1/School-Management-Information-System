using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Students;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/students")]
public sealed class StudentsController(StudentService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<object>>> GetAll(CancellationToken cancellationToken)
    {
        var students = await service.GetAllAsync(cancellationToken);
        return Ok(students);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var student = await service.GetByIdAsync(id, cancellationToken);
        return student is null ? NotFound() : Ok(student);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateStudentRequest request, CancellationToken cancellationToken)
    {
        var student = await service.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = student.Id }, student);
    }
}
