import collections
import collections.abc
collections.Mapping = collections.abc.Mapping
collections.MutableMapping = collections.abc.MutableMapping
collections.Iterable = collections.abc.Iterable
collections.MutableSet = collections.abc.MutableSet
collections.Callable = collections.abc.Callable

from experta import Fact, Field

class StudentData(Fact):
    cgpa = Field(float, default=0.0)
    failed_subjects = Field(int, default=0)
    attendance_pct = Field(float, default=100.0)
    year = Field(int, default=1)
    program = Field(str, default="General")

def test_extra_kwargs():
    # This is what students.py and chat.py are currently doing
    # using student_data which has 'id' and 'name'
    data = {'id': 101, 'name': 'John', 'cgpa': 1.8, 'program': 'CS', 'year': 2, 'attendance_pct': 72.0}
    try:
        sd = StudentData(**data)
        print("Success initializing with extra kwargs")
        print(sd)
    except Exception as e:
        print(f"Failed to initialize with extra kwargs: {type(e).__name__}: {e}")

if __name__ == "__main__":
    test_extra_kwargs()
