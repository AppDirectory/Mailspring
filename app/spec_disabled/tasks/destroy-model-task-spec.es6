import { Model, DatabaseStore, DestroyModelTask, DatabaseWriter } from 'mailspring-exports';

xdescribe('DestroyModelTask', function destroyModelTask() {
  beforeEach(() => {
    this.existingModel = new Model();
    this.existingModel.id = 'local-123';
    spyOn(DatabaseWriter.prototype, 'unpersistModel');
    spyOn(DatabaseStore, 'findBy').andCallFake(() => {
      return Promise.resolve(this.existingModel);
    });

    this.defaultArgs = {
      id: 'local-123',
      accountId: 'a123',
      modelName: 'Model',
      endpoint: '/endpoint',
    };
  });

  it('constructs without error', () => {
    const t = new DestroyModelTask();
    expect(t._rememberedToCallSuper).toBe(true);
  });

  describe('performLocal', () => {
    it('throws if basic fields are missing', () => {
      const t = new DestroyModelTask();
      try {
        t.performLocal();
        throw new Error("Shouldn't succeed");
      } catch (e) {
        expect(e.message).toMatch(/^Must pass.*/);
      }
    });

    it("throws if the model name can't be found", () => {
      this.defaultArgs.modelName = 'dne';
      const t = new DestroyModelTask(this.defaultArgs);
      try {
        t.performLocal();
        throw new Error("Shouldn't succeed");
      } catch (e) {
        expect(e.message).toMatch(/^Couldn't find the class for.*/);
      }
    });

    it("throws if it can't find the object", () => {
      jasmine.unspy(DatabaseStore, 'findBy');
      spyOn(DatabaseStore, 'findBy').andCallFake(() => {
        return Promise.resolve(null);
      });
      const t = new DestroyModelTask(this.defaultArgs);
      window.waitsForPromise(() => {
        return t
          .performLocal()
          .then(() => {
            throw new Error("Shouldn't succeed");
          })
          .catch(err => {
            expect(err.message).toMatch(/^Couldn't find the model with id.*/);
          });
      });
    });

    it('unpersists the new existing model properly', () => {
      const unpersistFn = DatabaseWriter.prototype.unpersistModel;
      const t = new DestroyModelTask(this.defaultArgs);
      window.waitsForPromise(() => {
        return t.performLocal().then(() => {
          expect(unpersistFn).toHaveBeenCalled();
          const model = unpersistFn.calls[0].args[0];
          expect(model).toBe(this.existingModel);
        });
      });
    });
  });
});
