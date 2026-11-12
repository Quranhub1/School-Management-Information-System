using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;

namespace SchoolManagement.Api.Services;

public enum CircuitState
{
    Closed,
    Open,
    HalfOpen
}

public sealed class CircuitBreakerService
{
    private readonly string _name;
    private readonly int _failureThreshold;
    private readonly TimeSpan _resetTimeout;
    private readonly int _halfOpenMaxCalls;

    private int _failures;
    private DateTimeOffset _lastFailureTime;
    private int _halfOpenCalls;
    private CircuitState _state = CircuitState.Closed;

    private static readonly ConcurrentDictionary<string, CircuitBreakerService> _instances = new();

    public CircuitState State => _state;

    public static CircuitBreakerService GetOrCreate(string name, int failureThreshold = 5, TimeSpan? resetTimeout = null, int halfOpenMaxCalls = 3)
    {
        return _instances.GetOrAdd(name, _ => new CircuitBreakerService(name, failureThreshold, resetTimeout ?? TimeSpan.FromMinutes(2), halfOpenMaxCalls));
    }

    private CircuitBreakerService(string name, int failureThreshold, TimeSpan resetTimeout, int halfOpenMaxCalls)
    {
        _name = name;
        _failureThreshold = failureThreshold;
        _resetTimeout = resetTimeout;
        _halfOpenMaxCalls = halfOpenMaxCalls;
    }

    public event Action? CircuitOpened;
    public event Action? CircuitClosed;
    public event Action? CircuitHalfOpen;

    public async Task<T> Execute<T>(Func<Task<T>> action)
    {
        if (_state == CircuitState.Open)
        {
            if (DateTimeOffset.UtcNow - _lastFailureTime < _resetTimeout)
                throw new CircuitBreakerOpenException($"Circuit breaker '{_name}' is open.");
            _state = CircuitState.HalfOpen;
            _halfOpenCalls = 0;
            CircuitHalfOpen?.Invoke();
        }

        try
        {
            var result = await action();
            OnSuccess();
            return result;
        }
        catch
        {
            OnFailure();
            throw;
        }
    }

    public async Task Execute(Func<Task> action)
    {
        if (_state == CircuitState.Open)
        {
            if (DateTimeOffset.UtcNow - _lastFailureTime < _resetTimeout)
                throw new CircuitBreakerOpenException($"Circuit breaker '{_name}' is open.");
            _state = CircuitState.HalfOpen;
            _halfOpenCalls = 0;
            CircuitHalfOpen?.Invoke();
        }

        try
        {
            await action();
            OnSuccess();
        }
        catch
        {
            OnFailure();
            throw;
        }
    }

    private void OnSuccess()
    {
        _failures = 0;
        if (_state == CircuitState.HalfOpen)
        {
            _state = CircuitState.Closed;
            CircuitClosed?.Invoke();
        }
    }

    private void OnFailure()
    {
        _failures++;
        _lastFailureTime = DateTimeOffset.UtcNow;

        if (_state == CircuitState.HalfOpen)
        {
            _halfOpenCalls++;
            if (_halfOpenCalls >= _halfOpenMaxCalls)
            {
                _state = CircuitState.Open;
                CircuitOpened?.Invoke();
            }
        }
        else if (_failures >= _failureThreshold)
        {
            _state = CircuitState.Open;
            CircuitOpened?.Invoke();
        }
    }
}

public sealed class CircuitBreakerOpenException : Exception
{
    public CircuitBreakerOpenException(string message) : base(message) { }
}
